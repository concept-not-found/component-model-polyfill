import pipe from '../pipe.js'
import Parser from '../parser/index.js'

import indexComponent from './index.js'
import parseComponent from './grammar.js'

describe('index component', () => {
  test('empty', () => {
    const wat = `
      (component)
    `

    const parser = Parser()
    const component = pipe(parser, parseComponent)(wat)
    indexComponent(component)

    expect(component).toEqual({
      type: 'component',
      components: [],
      modules: [],
      instances: [],
      funcs: [],
      tables: [],
      memories: [],
      globals: [],
      imports: [],
      exports: [],
      symbolIndex: {
        components: {},
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
