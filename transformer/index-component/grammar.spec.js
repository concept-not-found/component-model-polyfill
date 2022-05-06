import Parser from '../parser/index.js'

import parseComponent from './grammar.js'

describe('component', () => {
  describe('parser', () => {
    test('empty component', () => {
      const wat = `
        (component
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const component = parseComponent(input)
      expect(component).toEqual({
        type: 'component',
        definitions: [],
      })
    })
    test('instantiate with', () => {
      const wat = `
        (component
          (instance (instantiate (module 1)
            (with "imp" (instance 0))
          ))
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const component = parseComponent(input)
      expect(component).toEqual({
        type: 'component',
        definitions: [
          {
            type: 'instance',
            instanceExpression: {
              type: 'instantiate module',
              moduleIdx: 1,
              arguments: [
                {
                  name: 'imp',
                  type: 'reference',
                  reference: {
                    kind: 'instance',
                    kindIdx: 0,
                  },
                },
              ],
            },
          },
        ],
      })
    })
  })
})
