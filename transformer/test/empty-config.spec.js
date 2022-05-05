import onedent from '../onedent.js'
import transformer from '../index.js'

describe('component-transformer', () => {
  describe('empty config', () => {
    test('empty component', () => {
      const wat = `
        (component (;0;))
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        components: [],
        modules: [],
        imports: {},
        instances: [],
        exports: {},
      })
    })

    test('nested empty module', () => {
      const wat = `
        (component (;0;)
          (module (;0;))
        )
      `
      const component = transformer(wat)
      expect(component).toEqual({
        kind: 'component',
        components: [],
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
        exports: {},
      })
    })
  })
})
