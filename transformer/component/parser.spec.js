import pipe from '../pipe.js'
import { Parser as SexpParser } from '../sexp/index.js'

import parse from './parser.js'

describe('component', () => {
  describe('parser', () => {
    test('empty component', () => {
      const wat = `
        (component
        )
      `
      const parseSexp = SexpParser()
      const component = pipe(parseSexp, parse)(wat)
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
      const parseSexp = SexpParser()
      const component = pipe(parseSexp, parse)(wat)
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
