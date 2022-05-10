import pipe from '../pipe.js'
import { Parser as SexpParser } from '../sexp/index.js'

import parse from './parser.js'
import index from './indexer.js'

describe('index component', () => {
  test('empty', () => {
    const wat = `
      (component)
    `

    const component = pipe(SexpParser(), parse, index)(wat)

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
