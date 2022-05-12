import pipe from '../pipe.js'
import { Parser as SexpParser } from '../sexp/index.js'

import parse from './parser.js'
import index from './indexer.js'

describe('index component', () => {
  describe('export defintion', () => {
    describe('module', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (module)
            (export "ex" (module 0))
          )
        `

        const component = pipe(SexpParser(), parse, index)(wat)

        expect(component.exports).toEqual([
          {
            type: 'export',
            name: 'ex',
            kindReference: {
              kind: 'module',
              kindIdx: 0,
            },
          },
        ])
        expect(component.exports[0].kindReference.path()).toEqual([
          'modules',
          0,
        ])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (module $M)
            (export "ex" (module $M))
          )
        `

        const component = pipe(SexpParser(), parse, index)(wat)

        expect(component.exports).toEqual([
          {
            type: 'export',
            name: 'ex',
            kindReference: {
              kind: 'module',
              kindIdx: '$M',
            },
          },
        ])
        expect(component.exports[0].kindReference.path()).toEqual([
          'modules',
          0,
        ])
      })
    })
  })
})
