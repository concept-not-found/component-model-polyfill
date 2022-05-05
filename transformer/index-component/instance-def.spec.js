import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexComponent from './index.js'
import parseComponent from './grammar.js'

describe('index component', () => {
  describe('instance definition', () => {
    describe('empty instance', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (instance)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0]).toEqual({
          type: 'instance',
          instanceExpression: {
            type: 'tupling',
            exports: [],
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (instance $i)
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0]).toEqual({
          type: 'instance',
          name: '$i',
          instanceExpression: {
            type: 'tupling',
            exports: [],
          },
        })
      })
    })

    describe('instance instantiates component', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (component)
            (instance (instantiate (component 0)))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.componentPath()
        ).toEqual(['components', 0])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (component $M)
            (instance (instantiate (component $M)))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.componentPath()
        ).toEqual(['components', 0])
      })
    })

    describe('instance imports component', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (component
              (import "self" (component))
            )
            (instance (instantiate (component 0)
              (import "self" (component 0))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0].instanceExpression.imports).toEqual([
          {
            name: 'self',
            kindReference: {
              kind: 'component',
              kindIdx: 0,
            },
          },
        ])
        expect(
          component.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['components', 0])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (component $M
              (import "self" (component))
            )
            (instance (instantiate (component $M)
              (import "self" (component $M))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0].instanceExpression.imports).toEqual([
          {
            name: 'self',
            kindReference: {
              kind: 'component',
              kindIdx: '$M',
            },
          },
        ])
        expect(
          component.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['components', 0])
      })
    })

    describe('instance imports func', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (component
              (import "f" (func))
            )
            (import "imp" (func))
            (instance (instantiate (component 0)
              (import "f" (func 0))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (component
              (import "f" (func))
            )
            (import "imp" (func $f))
            (instance (instantiate (component 0)
              (import "f" (func $f))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.imports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('instance exports module', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (module)
            (instance
              (export "ex" (module 0))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0].instanceExpression.exports[0]).toEqual({
          name: 'ex',
          kindReference: {
            kind: 'module',
            kindIdx: 0,
          },
        })
        expect(
          component.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (module $M)
            (instance
              (export "ex" (module $M))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0].instanceExpression.exports[0]).toEqual({
          name: 'ex',
          kindReference: {
            kind: 'module',
            kindIdx: '$M',
          },
        })
        expect(
          component.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['modules', 0])
      })
    })

    describe('instance exports func', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (import "imp" (func))
            (instance
              (export "f" (func 0))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })

      test('explicit index', () => {
        const wat = `
          (component
            (import "imp" (func $f))
            (instance
              (export "f" (func $f))
            )
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(
          component.instances[0].instanceExpression.exports[0].kindReference.path()
        ).toEqual(['imports', 'imp'])
      })
    })

    describe('import instance', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (import "imp" (instance
              (export "f" (func))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[0]).toEqual({
          type: 'instance',
          instanceExpression: {
            type: 'tupling',
            exports: [
              {
                name: 'f',
                kindType: {
                  type: 'func',
                },
              },
            ],
          },
          import: {
            name: 'imp',
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (import "imp" (instance $i
              (export "f" (func))
            ))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.instances.$i).toBe(0)
        expect(component.instances[0]).toEqual({
          type: 'instance',
          name: '$i',
          instanceExpression: {
            type: 'tupling',
            exports: [
              {
                name: 'f',
                kindType: {
                  type: 'func',
                },
              },
            ],
          },
          import: {
            name: 'imp',
          },
        })
      })
    })

    describe('alias instance', () => {
      test('implicit index', () => {
        const wat = `
          (component
            (import "imp" (instance
              (export "f" (func))
            ))
            (alias 0 0 (instance))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.instances[1]).toEqual({
          type: 'instance',
          alias: {
            type: 'outer',
            outerIdx: 0,
            kindIdx: 0,
          },
        })
      })

      test('explicit index', () => {
        const wat = `
          (component
            (import "imp" (instance
              (export "f" (func))
            ))
            (alias 0 0 (instance $i))
          )
        `

        const parser = Parser()
        const component = pipe(parser, parseComponent)(wat)
        indexComponent(component)

        expect(component.symbolIndex.instances.$i).toBe(1)
        expect(component.instances[1]).toEqual({
          type: 'instance',
          name: '$i',
          alias: {
            type: 'outer',
            outerIdx: 0,
            kindIdx: 0,
          },
        })
      })
    })
  })
})
