import pipe from '../pipe.js'
import { Parser as SexpParser } from '../sexp/index.js'

import parse from './parser.js'

describe('core module', () => {
  describe('parser', () => {
    test('empty module', () => {
      const wat = `
        (module
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [],
      })
    })

    test('single func', () => {
      const wat = `
        (module
          (func)
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
          },
        ],
      })
    })

    test('double func', () => {
      const wat = `
        (module
          (func)
          (func)
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
          },
          {
            type: 'func',
          },
        ],
      })
    })

    test('named func', () => {
      const wat = `
        (module
          (func $f)
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
            name: '$f',
          },
        ],
      })
    })

    test('exported func', () => {
      const wat = `
        (module
          (export "exp" (func $f))
          (func $f)
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'export',
            name: 'exp',
            kindReference: {
              kind: 'func',
              kindIdx: '$f',
            },
          },
          {
            type: 'func',
            name: '$f',
          },
        ],
      })
    })
    test('imported func', () => {
      const wat = `
        (module
          (import "imp" "f" (func $f))
        )
      `
      const parseSexp = SexpParser()
      const module = pipe(parseSexp, parse)(wat)
      expect(module).toEqual({
        type: 'module',
        definitions: [
          {
            type: 'func',
            name: '$f',
            import: {
              moduleName: 'imp',
              name: 'f',
            },
          },
        ],
      })
    })
  })
})
