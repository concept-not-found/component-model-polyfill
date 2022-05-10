import pipe from '../../pipe.js'
import { Parser as SexpParser } from '../../sexp/index.js'
import { module, name, kind, kindDefinition } from './index.js'

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
      ])('matched “$wat” due to $reason', ({ wat, value }) => {
        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual(value)
      })

      test.each([
        {
          wat: `
            (module foo)
          `,
          reason: 'a module names must start with a “$”',
        },
      ])('unmatched “$wat” due to $reason', ({ wat }) => {
        const result = pipe(SexpParser(), module)(wat)

        expect(result.matched).toBe(false)
      })
    })

    describe('name', () => {
      test('func', () => {
        const matcher = name
        const result = matcher({ type: 'value', value: '$f' })
        expect(result.value).toEqual('$f')
      })
    })

    describe('kind', () => {
      test('func', () => {
        const matcher = kind
        const result = matcher({ type: 'value', value: 'func' })
        expect(result.value).toEqual('func')
      })
    })

    describe('kindDefinition', () => {
      test('named func', () => {
        const matcher = kindDefinition
        const result = matcher({
          type: 'sexp',
          value: [
            { type: 'value', value: 'func' },
            { type: 'value', value: '$f' },
          ],
        })
        expect(result.value).toEqual({
          type: 'func',
          name: '$f',
        })
      })
    })
  })
})
