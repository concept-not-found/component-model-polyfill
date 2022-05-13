import pipe from '../../pipe.js'
import { Parser as SexpParser } from '../../sexp/index.js'
import component from './index.js'

describe('component', () => {
  describe('grammar', () => {
    describe('a component is a sexp of definitions which are imports, exports, instances, aliases, modules and nested components', () => {
      test.each([
        {
          wat: `
            (component)
          `,
          value: {
            type: 'component',
            definitions: [],
          },
          reason: 'a component can be empty',
        },
        {
          wat: `
            (component $foo)
          `,
          value: {
            type: 'component',
            name: '$foo',
            definitions: [],
          },
          reason: 'a component can have a name starting with “$”',
        },
        {
          wat: `
            (component
              (import "foo" (func))
            )
          `,
          value: {
            type: 'component',
            definitions: [
              {
                import: {
                  name: 'foo',
                },
                type: 'func',
              },
            ],
          },
          reason: 'a component can have imports',
        },
        {
          wat: `
            (component
              (export "foo" (func 0))
            )
          `,
          value: {
            type: 'component',
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
          reason: 'a component can have exports',
        },
        {
          wat: `
            (component
              (instance (instantiate (component 0)))
            )
          `,
          value: {
            type: 'component',
            definitions: [
              {
                type: 'instance',
                instanceExpression: {
                  type: 'instantiate component',
                  componentIdx: 0,
                  arguments: [],
                },
              },
            ],
          },
          reason: 'a component can have instances',
        },
        {
          wat: `
            (component
              (alias $i "foo" (func $f))
            )
          `,
          value: {
            type: 'component',
            definitions: [
              {
                type: 'func',
                name: '$f',
                alias: {
                  type: 'instance export',
                  instanceIdx: '$i',
                  name: 'foo',
                },
              },
            ],
          },
          reason: 'a component can have aliases',
        },
        {
          wat: `
            (component
              (module)
            )
          `,
          value: {
            type: 'component',
            definitions: [
              {
                type: 'module',
                definitions: [],
              },
            ],
          },
          reason: 'a component can have modules',
        },
        {
          wat: `
            (component
              (component)
            )
          `,
          value: {
            type: 'component',
            definitions: [
              {
                type: 'component',
                definitions: [],
              },
            ],
          },
          reason: 'a component can nested components',
        },
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), component)(wat)

        expect(result.value).toEqual(value)
      })

      test.each([
        {
          wat: `
            (component foo)
          `,
          reason: 'component names must start with a “$”',
        },
        {
          wat: `
            (func)
          `,
          reason:
            'core kind types cannot be defined directly in components, only within modules',
        },
        {
          wat: `
            (global)
          `,
          reason:
            'core kind types cannot be defined directly in components, only within modules',
        },
        {
          wat: `
            (table)
          `,
          reason:
            'core kind types cannot be defined directly in components, only within modules',
        },
        {
          wat: `
            (memory)
          `,
          reason:
            'core kind types cannot be defined directly in components, only within modules',
        },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), component)(wat)

        expect(result.matched).toBe(false)
      })
    })

    describe('imports are named and typed', () => {
      test.each([
        {
          wat: `
            (import "foo" (func))
          `,
          value: {
            import: {
              name: 'foo',
            },
            type: 'func',
          },
          reason: 'import can declare name before kind type',
        },
        {
          wat: `
            (func (import "foo"))
          `,
          value: {
            import: {
              name: 'foo',
            },
            type: 'func',
          },
          reason: 'import can declare kind type before name',
        },
        {
          wat: `
            (import "foo" (func $f))
          `,
          value: {
            import: {
              name: 'foo',
            },
            type: 'func',
            name: '$f',
          },
          reason: 'kind type can be named starting with a “$“',
        },
        {
          wat: `
            (func $f (import "foo"))
          `,
          value: {
            import: {
              name: 'foo',
            },
            type: 'func',
            name: '$f',
          },
          reason: 'kind type can be named starting with a “$“',
        },
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), component)(`(component ${wat})`)

        expect(result.value.definitions[0]).toEqual(value)
      })

      test.each([
        {
          wat: `
            (import "foo")
          `,
          reason: 'import must include a kind type',
        },
        {
          wat: `
            (import (func))
          `,
          reason: 'import must include name',
        },
        {
          wat: `
            (func (import))
          `,
          reason: 'import mustinclude name',
        },
        {
          wat: `
            (import foo (func))
          `,
          reason: 'import name must be a string',
        },
        {
          wat: `
            (foo (import foo))
          `,
          reason: 'import name must be a string',
        },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (import "foo" (func f))
        //   `,
        //   reason: 'kind type name must starts with a “$”',
        // },
        {
          wat: `
            (func f (import "foo"))
          `,
          reason: 'kind type name must starts with a “$”',
        },
        // need more precise grammar to handle this case
        // {
        //   wat: `
        //     (import "foo" (func "$f"))
        //   `,
        //   reason: 'kind type name must a value',
        // },
        {
          wat: `
            (func "$f" (import "foo"))
          `,
          reason: 'kind type name must a value',
        },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), component)(`(component ${wat})`)

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
        const result = pipe(SexpParser(), component)(`(component ${wat})`)

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
        const result = pipe(SexpParser(), component)(`(component ${wat})`)

        expect(result.matched).toBe(false)
      })
    })
  })
})
