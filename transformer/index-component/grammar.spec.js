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
  })
})
