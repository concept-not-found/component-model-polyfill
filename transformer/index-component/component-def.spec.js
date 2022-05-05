import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexComponent from './index.js'
import parseComponent from './grammar.js'

describe('index component', () => {
  describe('component definition', () => {
    describe('component', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (component)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        console.dir(component)
        indexComponent(component)

        expect(component.modules[0]).toEqual({
          type: 'component',
          modules: [],
          instances: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          imports: [],
          exports: [],
          symbolIndex: {
            modules: {},
            instances: {},
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (component $M)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.modules.$M).toBe(0)
        expect(component.modules[0]).toEqual({
          type: 'component',
          name: '$M',
          modules: [],
          instances: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          imports: [],
          exports: [],
          symbolIndex: {
            modules: {},
            instances: {},
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })
    })

    describe('module', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (module)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.modules[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          symbolIndex: {
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (module $M)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.modules.$M).toBe(0)
        expect(component.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          funcs: [],
          tables: [],
          memories: [],
          globals: [],
          symbolIndex: {
            funcs: {},
            tables: {},
            memories: {},
            globals: {},
          },
        })
      })
    })

    describe('import component', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (import "mod" (module))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.modules[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
        expect(component.imports[0]).toEqual({
          type: 'module',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (import "mod" (module $M))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.modules.$M).toBe(0)
        expect(component.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
        expect(component.imports[0]).toEqual({
          type: 'module',
          name: '$M',
          imports: [],
          exports: [],
          import: {
            name: 'mod',
          },
        })
      })
    })

    describe('alias module', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (alias 1 0 (module))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.modules[0]).toEqual({
          type: 'module',
          alias: {
            type: 'outer',
            outerIdx: 1,
            kindIdx: 0,
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (alias 1 0 (module $M))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.modules.$M).toBe(0)
        expect(component.modules[0]).toEqual({
          type: 'module',
          name: '$M',
          alias: {
            type: 'outer',
            outerIdx: 1,
            kindIdx: 0,
          },
        })
      })
    })
  })
})
