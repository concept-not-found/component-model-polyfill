import pipe from '../pipe.js'
import { Parser as SexpParser } from '../sexp/index.js'

import parse from './parser.js'
import index from './indexer.js'

describe('index module', () => {
  describe('empty func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (func)
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      expect(module.funcs[0]).toEqual({
        type: 'func',
      })
    })
    test('explicit index', () => {
      const wat = `
        (module
          (func $f)
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      expect(module.symbolIndex.funcs.$f).toBe(0)
      expect(module.funcs[0]).toEqual({
        type: 'func',
        name: '$f',
      })
    })
  })

  describe('export func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (export "ex" (func 0))
          (func)
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      expect(module.exports).toEqual([
        {
          type: 'export',
          name: 'ex',
          kindReference: {
            kind: 'func',
            kindIdx: 0,
          },
        },
      ])
      expect(module.exports[0].path()).toEqual(['funcs', 0])
    })

    test('explicit index', () => {
      const wat = `
        (module
          (export "ex" (func $f))
          (func $f)
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      expect(module.exports).toEqual([
        {
          type: 'export',
          name: 'ex',
          kindReference: {
            kind: 'func',
            kindIdx: '$f',
          },
        },
      ])
      expect(module.exports[0].path()).toEqual(['funcs', 0])
    })
  })

  describe('import func', () => {
    test('implicit index', () => {
      const wat = `
        (module
          (import "mod" "im" (func))
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      const expectedImportFunc = {
        type: 'func',
        import: {
          moduleName: 'mod',
          name: 'im',
        },
      }
      expect(module.funcs[0]).toEqual(expectedImportFunc)
      expect(module.imports).toEqual([expectedImportFunc])
    })

    test('explicit index', () => {
      const wat = `
        (module
          (import "mod" "im" (func $f))
        )
      `

      const module = pipe(SexpParser(), parse, index)(wat)

      expect(module.symbolIndex.funcs.$f).toBe(0)
      const expectedImportFunc = {
        type: 'func',
        name: '$f',
        import: {
          moduleName: 'mod',
          name: 'im',
        },
      }
      expect(module.funcs[0]).toEqual(expectedImportFunc)
      expect(module.imports).toEqual([expectedImportFunc])
    })
  })
})
