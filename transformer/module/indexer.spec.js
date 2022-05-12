import { match } from 'patcom'
import pipe from '../pipe.js'

import { Parser as SexpParser } from '../sexp/index.js'

import module from './grammar/index.js'
import index from './indexer.js'

const parse = (wat) => match(wat)(module)

function path(parts, object) {
  const original = object
  try {
    for (const part of parts) {
      object = object[part]
    }
    return object
  } catch {
    throw new Error(
      `failed to walk path [${parts.join(', ')}] in ${JSON.stringify(
        original,
        undefined,
        2
      )}`
    )
  }
}

describe('index module', () => {
  test('definitions are indexed into collections in the order in which they appear', () => {
    const wat = `
      (module
        (func $firstFunc)
        (global $firstGlobal)
        (func $secondFunc)
        (global $secondGlobal)
      )
    `

    const module = pipe(SexpParser(), parse, index)(wat)

    expect(module).toEqual({
      type: 'module',
      imports: [],
      funcs: [
        {
          type: 'func',
          name: '$firstFunc',
        },
        {
          type: 'func',
          name: '$secondFunc',
        },
      ],
      globals: [
        {
          type: 'global',
          name: '$firstGlobal',
        },
        {
          type: 'global',
          name: '$secondGlobal',
        },
      ],
      memories: [],
      tables: [],
      symbolIndex: expect.anything(),
      exports: [],
    })
  })

  test('definition names are indexed in symbolIndex', () => {
    const wat = `
      (module
        (func)
        (func $secondFuncIsIndex1)
      )
    `

    const module = pipe(SexpParser(), parse, index)(wat)

    expect(module).toEqual({
      type: 'module',
      imports: [],
      funcs: [
        {
          type: 'func',
        },
        {
          type: 'func',
          name: '$secondFuncIsIndex1',
        },
      ],
      globals: [],
      memories: [],
      tables: [],
      symbolIndex: {
        funcs: {
          $secondFuncIsIndex1: 1,
        },
        globals: {},
        memories: {},
        tables: {},
      },
      exports: [],
    })
  })

  test('imports take up index space in the collection and are also in their own collection', () => {
    const wat = `
      (module
        (func (import "mod" "f"))
        (func)
        (import "mod" "g" (func))
      )
    `

    const module = pipe(SexpParser(), parse, index)(wat)

    expect(module).toEqual({
      type: 'module',
      imports: [
        {
          type: 'func',
          import: {
            moduleName: 'mod',
            name: 'f',
          },
        },
        {
          type: 'func',
          import: {
            moduleName: 'mod',
            name: 'g',
          },
        },
      ],
      funcs: [
        {
          type: 'func',
          import: {
            moduleName: 'mod',
            name: 'f',
          },
        },
        {
          type: 'func',
        },
        {
          type: 'func',
          import: {
            moduleName: 'mod',
            name: 'g',
          },
        },
      ],
      globals: [],
      memories: [],
      tables: [],
      symbolIndex: expect.anything(),
      exports: [],
    })
  })

  test('exports are in their own collection and path() is an array of path parts in module to the exported definition', () => {
    const wat = `
      (module
        (func)
        (export "foo" (func 0))
        (global $g)
        (export "bar" (global $g))
      )
    `

    const module = pipe(SexpParser(), parse, index)(wat)

    expect(module).toEqual({
      type: 'module',
      imports: [],
      funcs: [
        {
          type: 'func',
        },
      ],
      globals: [
        {
          type: 'global',
          name: '$g',
        },
      ],
      memories: [],
      tables: [],
      symbolIndex: expect.anything(),
      exports: [
        {
          type: 'export',
          name: 'foo',
          kindReference: {
            kind: 'func',
            kindIdx: 0,
          },
        },
        {
          type: 'export',
          name: 'bar',
          kindReference: {
            kind: 'global',
            kindIdx: '$g',
          },
        },
      ],
    })

    expect(module.exports[0].path()).toEqual(['funcs', 0])
    expect(path(module.exports[0].path(), module)).toEqual({
      type: 'func',
    })

    expect(module.exports[1].path()).toEqual(['globals', 0])
    expect(path(module.exports[1].path(), module)).toEqual({
      type: 'global',
      name: '$g',
    })
  })
})
