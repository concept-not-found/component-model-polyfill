import runtime from './index.js'

describe('component-module-polyfill-runtime', () => {
  test('component refers to parent', () => {
    const config = {
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
        },
      ],
      exports: {
        exp: {
          kind: 'func',
          path: ['instances', 0, 'exports', 'inner-exp'],
        },
      },
    }
    const imp = Symbol()
    const {
      exports: { exp },
    } = runtime(config, {
      imp,
    })
    expect(exp).toBe(imp)
  })
})
