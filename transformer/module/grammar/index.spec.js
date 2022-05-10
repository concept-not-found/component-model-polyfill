import pipe from '../../pipe.js'
import { Parser as SexpParser } from '../../sexp/index.js'
import { module, name, kind, kindDefinition } from './index.js'

describe('module', () => {
  describe('grammar', () => {
    describe('a module is a sexp of definitions which are imports, exports, and kinds', () => {
      test('a module can be empty', () => {
        const wat = `
          (module)
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual({
          type: 'module',
          definitions: [],
        })
      })

      test('a module can have a name starting with “$”', () => {
        const wat = `
          (module $foo)
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual({
          type: 'module',
          name: '$foo',
          definitions: [],
        })
      })

      test('a module names must start with a “$”', () => {
        const wat = `
          (module foo)
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.matched).toBe(false)
      })

      test('a module can be import things', () => {
        const wat = `
          (module
            (import "foo" "bar" (func))
          )
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual({
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
        })
      })

      test('a module can be export things', () => {
        const wat = `
          (module
            (export "foo" (func 0))
          )
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual({
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
        })
      })

      test('a module can define kinds of things', () => {
        const wat = `
          (module
            (func)
          )
        `

        const result = pipe(SexpParser(), module)(wat)

        expect(result.value).toEqual({
          type: 'module',
          definitions: [
            {
              type: 'func',
            },
          ],
        })
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
