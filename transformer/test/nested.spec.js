import transformer from '../index.js'

describe('component-transformer', () => {
  describe('nested', () => {
    test('nested empty component', () => {
      const wat = `
        (component (;0;)
          (component (;0;))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        components: [
          {
            kind: 'component',
            components: [],
            modules: [],
            imports: {},
            instances: [],
            exports: {},
          },
        ],
        modules: [],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('nested nested empty component', () => {
      const wat = `
        (component (;0;)
          (component (;0;)
            (component (;0;))
          )
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        components: [
          {
            kind: 'component',
            components: [
              {
                kind: 'component',
                components: [],
                modules: [],
                imports: {},
                instances: [],
                exports: {},
              },
            ],
            modules: [],
            imports: {},
            instances: [],
            exports: {},
          },
        ],
        modules: [],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('re-export func via inner component', () => {
      const wat = `
        (component (;0;)
          (import "imp" (func (;0;)))
          (component (;0;)
            (alias (;outer;) 1 (;func;) 0 (func (;0;)))
            (export "inner-exp" (func 0))
          )
          (instance (;0;) (instantiate (component 0)))
          (alias (;instance;) 0 "inner-exp" (func (;1;)))
          (export "exp" (func 1))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        components: [
          {
            kind: 'component',
            components: [],
            modules: [],
            imports: {},
            instances: [],
            exports: {
              'inner-exp': {
                kind: 'func',
                path: ['..', 'imports', 'imp'],
              },
            },
          },
        ],
        modules: [],
        imports: {
          imp: {
            kind: 'func',
            kindType: [],
          },
        },
        instances: [
          {
            kind: 'component',
            componentPath: ['components', 0],
            imports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'inner-exp'],
          },
        },
      })
    })
  })
})
