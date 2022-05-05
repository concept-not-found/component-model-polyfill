import dedent from '../dedent.js'
import onedent from '../onedent.js'
import transformer from '../index.js'

describe('component-transformer', () => {
  describe('export', () => {
    test('export module func', () => {
      const wat = dedent`
        (component (;0;)
          (module (;0;)
            (func (;0;))
            (export "f" (func 0))
          )
          (instance (;0;) (instantiate (;module;) 0))
          (alias (;instance;) 0 "f" (func (;0;)))
          (export "exp" (func 0))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        modules: [
          {
            kind: 'module',
            source: onedent`
              (module (;0;)
                (func (;0;))
                (export "f" (func 0))
              )
            `,
          },
        ],
        imports: {},
        instances: [
          {
            kind: 'module',
            modulePath: ['modules', 0],
            imports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'func',
            path: ['instances', 0, 'exports', 'f'],
          },
        },
      })
    })

    test('export instance', () => {
      const wat = `
        (component (;0;)
          (instance (;0;))
          (export "exp" (instance 0))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        modules: [],
        imports: {},
        instances: [
          {
            kind: 'instance',
            exports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'instance',
            path: ['instances', 0],
          },
        },
      })
    })

    test('export module', () => {
      const wat = dedent`
        (component (;0;)
          (module (;0;))
          (export "exp" (module 0))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        modules: [
          {
            kind: 'module',
            source: onedent`
              (module (;0;))
            `,
          },
        ],
        imports: {},
        instances: [],
        exports: {
          exp: {
            kind: 'module',
            path: ['modules', 0],
          },
        },
      })
    })

    test('export module instance', () => {
      const wat = dedent`
        (component (;0;)
          (module (;0;))
          (instance (;0;) (instantiate (;module;) 0))
          (export "exp" (instance 0))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        modules: [
          {
            kind: 'module',
            source: onedent`
              (module (;0;))
            `,
          },
        ],
        imports: {},
        instances: [
          {
            kind: 'module',
            modulePath: ['modules', 0],
            imports: {},
          },
        ],
        exports: {
          exp: {
            kind: 'instance',
            path: ['instances', 0],
          },
        },
      })
    })
  })
})
