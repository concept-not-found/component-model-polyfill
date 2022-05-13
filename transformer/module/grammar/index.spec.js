import pipe from '../../pipe.js'
import { Parser as SexpParser } from '../../sexp/index.js'
import module from './index.js'

describe('module', () => {
  describe('grammar', () => {
    describe('a module is a sexp of definitions which are imports, exports, and kinds', () => {
      test.each([
        {
          wat: `
            (module)
          `,
          value: {
            type: 'module',
            definitions: [],
          },
          reason: 'a module can be empty',
        },
        {
          wat: `
            (module $foo)
          `,
          value: {
            type: 'module',
            name: '$foo',
            definitions: [],
          },
          reason: 'a module can have a name starting with “$”',
        },
        {
          wat: `
            (module
              (import "foo" "bar" (func))
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                import: {
                  moduleName: 'foo',
                  name: 'bar',
                },
                type: 'func',
              },
            ],
          },
          reason: 'a module can have imports',
        },
        {
          wat: `
            (module
              (export "foo" (func 0))
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                type: 'export',
                name: 'foo',
                kindReference: {
                  kind: 'func',
                  kindIdx: 0,
                },
              },
            ],
          },
          reason: 'a module can have exports',
        },
        {
          wat: `
            (module
              (func)
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                type: 'func',
              },
            ],
          },
          reason: 'a module can have funcs',
        },
        {
          wat: `
            (module
              (table)
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                type: 'table',
              },
            ],
          },
          reason: 'a module can have tables',
        },
        {
          wat: `
            (module
              (global)
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                type: 'global',
              },
            ],
          },
          reason: 'a module can have globals',
        },
        {
          wat: `
            (module
              (memory 1)
            )
          `,
          value: {
            type: 'module',
            definitions: [
              {
                type: 'memory',
              },
            ],
          },
          reason: 'a module can have memory',
        },
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual(value)
      })

      test.each([
        {
          wat: `
            (module foo)
          `,
          reason: 'module names must start with a “$”',
        },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), module)(wat)

        expect(result.matched).toBe(false)
      })
    })

    describe('imports are named and typed', () => {
      test.each([
        {
          wat: `
            (import "foo" "bar" (func))
          `,
          value: {
            import: {
              moduleName: 'foo',
              name: 'bar',
            },
            type: 'func',
          },
          reason: 'import can declare module name and name before kind type',
        },
        {
          wat: `
            (func (import "foo" "bar"))
          `,
          value: {
            import: {
              moduleName: 'foo',
              name: 'bar',
            },
            type: 'func',
          },
          reason: 'import can declare kind type before module name and name',
        },
        {
          wat: `
            (import "foo" "bar" (func $f))
          `,
          value: {
            import: {
              moduleName: 'foo',
              name: 'bar',
            },
            type: 'func',
            name: '$f',
          },
          reason: 'kind type can be named starting with a “$“',
        },
        {
          wat: `
            (func $f (import "foo" "bar"))
          `,
          value: {
            import: {
              moduleName: 'foo',
              name: 'bar',
            },
            type: 'func',
            name: '$f',
          },
          reason: 'kind type can be named starting with a “$“',
        },
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), module)(`(module ${wat})`)

        expect(result.value.definitions[0]).toEqual(value)
      })

      test.each([
        {
          wat: `
            (import "foo" "bar")
          `,
          reason: 'import must include a kind type',
        },
        {
          wat: `
            (import (func))
          `,
          reason: 'import include both a module name and name',
        },
        {
          wat: `
            (import "foo" (func))
          `,
          reason: 'import include both a module name and name',
        },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (func (import))
        //   `,
        //   reason: 'import include both a module name and name',
        // },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (func (import "foo"))
        //   `,
        //   reason: 'import include both a module name and name',
        // },
        {
          wat: `
            (import foo bar (func))
          `,
          reason: 'import module name and name must be strings',
        },
        {
          wat: `
            (foo (import foo bar))
          `,
          reason: 'import module name and name must be strings',
        },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (import "foo" "bar" (func f))
        //   `,
        //   reason: 'kind type name must starts with a “$”',
        // },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (func f (import "foo" "bar"))
        //   `,
        //   reason: 'kind type name must starts with a “$”',
        // },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (import "foo" "bar" (func "$f"))
        //   `,
        //   reason: 'kind type name must a value',
        // },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (func "$f" (import "foo" "bar"))
        //   `,
        //   reason: 'kind type name must a value',
        // },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), module)(`(module ${wat})`)

        expect(result.matched).toBe(false)
      })
    })

    describe('exports are named and refer to a kind', () => {
      test.each([
        {
          wat: `
            (export "foo" (func 0))
          `,
          value: {
            type: 'export',
            name: 'foo',
            kindReference: {
              kind: 'func',
              kindIdx: 0,
            },
          },
          reason: 'export can declare name before kind reference',
        },
        {
          wat: `
            (export "foo" (func $f))
          `,
          value: {
            type: 'export',
            name: 'foo',
            kindReference: {
              kind: 'func',
              kindIdx: '$f',
            },
          },
          reason: 'kind reference can be by name starting with “$“',
        },
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), module)(`(module ${wat})`)

        expect(result.value.definitions[0]).toEqual(value)
      })

      test.each([
        {
          wat: `
            (export (func 0))
          `,
          reason: 'export must include a name',
        },
        {
          wat: `
            (export "foo" (func))
          `,
          reason:
            'kind reference must be either an index or name starting with “$”',
        },
        {
          wat: `
            (export foo (func 0))
          `,
          reason: 'export name must be a string',
        },
        {
          wat: `
            (export "foo" (func "$f"))
          `,
          reason: 'kind reference name must be a value',
        },
        {
          wat: `
            (export "foo")
          `,
          reason: 'export must include a kind reference',
        },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), module)(`(module ${wat})`)

        expect(result.matched).toBe(false)
      })
    })
  })
})
