import transformer from '../index.js'

describe('component-transformer', () => {
  describe('alias', () => {
    describe('instance export', () => {
      test.each([
        {
          form: 'alias first',
          wat: `
            (component
              (import "imp" (instance $i
                (export "inner-exp" (func))
              ))
              (alias $i "inner-exp" (func $f))
              (export "exp" (func $f))
            )
          `,
        },
        {
          form: 'inline alias',
          wat: `
            (component
              (instance $i (import "imp")
                (export "inner-exp" (func))
              )
              (func $f (alias $i "inner-exp"))
              (export "exp" (func $f))
            )
          `,
        },
      ])('$form', ({ wat }) => {
        const component = transformer(wat)
        expect(component).toEqual({
          kind: 'component',
          components: [],
          modules: [],
          imports: {
            imp: {
              kind: 'instance',
              exports: {
                'inner-exp': {
                  kind: 'func',
                },
              },
            },
          },
          instances: [
            {
              kind: 'instance',
              path: ['imports', 'imp'],
              exports: {
                'inner-exp': {
                  kind: 'func',
                },
              },
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

    describe('outer', () => {
      test.each([
        {
          form: 'alias first',
          wat: `
            (component $M
              (import "imp" (func $f))
              (component $N
                (alias $M $f (func $g))
                (export "inner-exp" (func $g))
              )
              (export "exp" (component $N))
            )
          `,
        },
        {
          form: 'inline alias',
          wat: `
            (component $M
              (func $f (import "imp"))
              (component $N
                (func $g (alias $M $f))
                (export "inner-exp" (func $g))
              )
              (export "exp" (component $N))
            )
          `,
        },
      ])('$form', ({ wat }) => {
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
          instances: [],
          exports: {
            exp: {
              kind: 'component',
              path: ['components', 0],
            },
          },
        })
      })
    })
  })
})
