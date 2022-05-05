import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexComponent from './index.js'
import parseComponent from './grammar.js'

describe('index component', () => {
  describe('alias definition', () => {
    describe('instance export', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (module)
            (instance
              (export "ex" (module 0))
            )
            (alias 0 "ex" (module))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.modules[1].path()).toEqual([
          'instances',
          0,
          'exports',
          'ex',
        ])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (module)
            (instance $i
              (export "ex" (module 0))
            )
            (alias $i "ex" (module))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.modules[1].path()).toEqual([
          'instances',
          0,
          'exports',
          'ex',
        ])
      })
    })

    describe('outer', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (module)
            (component
              (alias 1 0 (module))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        const ancestors = [component, component.modules[1]]
        expect(component.components[0].modules[0].path(ancestors)).toEqual([
          '..',
          'modules',
          0,
        ])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (module $M)
            (component
              (alias 1 $M (module))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        const ancestors = [component, component.modules[1]]
        expect(component.components[0].modules[0].path(ancestors)).toEqual([
          '..',
          'modules',
          0,
        ])
      })
    })
  })
})
