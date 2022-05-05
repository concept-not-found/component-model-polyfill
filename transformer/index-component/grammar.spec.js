import Parser from '../parser/index.js'

import parseComponent from './grammar.js'

describe('component', () => {
  describe('parser', () => {
    test('empty module', () => {
      const wat = `
        (component
        )
      `
      const parser = Parser()
      const input = parser(wat)
      const module = parseComponent(input)
      expect(module).toEqual({
        type: 'component',
        definitions: [],
      })
    })
  })
})
