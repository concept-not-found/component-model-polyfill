import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexComponent from './index.js'
import parseComponent from './grammar.js'

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

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

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

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

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
