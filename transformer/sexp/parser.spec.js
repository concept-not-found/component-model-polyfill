import { some, asInternalIterator } from 'patcom'

import SexpParser, {
  valueMatcher,
  stringMatcher,
  sexpMatcher,
  blockCommentMatcher,
  lineCommentMatcher,
} from './parser.js'

describe('parser', () => {
  describe('valueMatcher matches everything until a deliminator', () => {
    test.each([
      { wat: 'foo', deliminator: 'end of file' },
      { wat: 'foo(bar', deliminator: 'start of sexp' },
      { wat: 'foo)bar', deliminator: 'end of sexp' },
      { wat: 'foo bar', deliminator: 'whitespace' },
      { wat: 'foo"bar', deliminator: 'string' },
      { wat: 'foo(;bar', deliminator: 'start of block comment' },
      { wat: 'foo;)bar', deliminator: 'end of block comment' },
      { wat: 'foo;;bar', deliminator: 'line comment' },
    ])('matched “$wat” up to $deliminator deliminator', ({ wat }) => {
      const matcher = valueMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'value',
        value: 'foo',
      })
    })

    test.each([
      { wat: '', deliminator: 'end of file' },
      { wat: '(foo', deliminator: 'start of sexp' },
      { wat: ')foo', deliminator: 'end of sexp' },
      { wat: ' foo', deliminator: 'whitespace' },
      { wat: '"foo', deliminator: 'string' },
      { wat: '(;foo', deliminator: 'start of block comment' },
      { wat: ';)foo', deliminator: 'end of block comment' },
      { wat: ';;foo', deliminator: 'line comment' },
    ])(
      'unmatched “$wat” as starts with $deliminator deliminator',
      ({ wat }) => {
        const matcher = valueMatcher
        const result = matcher(asInternalIterator(wat))

        expect(result.matched).toBe(false)
      }
    )
  })

  describe('stringMatcher', () => {
    test('matched empty string', () => {
      const wat = '""'
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'string',
        value: '',
      })
    })

    test('matched string', () => {
      const wat = '"module"'
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'string',
        value: 'module',
      })
    })

    test('matched string with escape', () => {
      const wat = '"\\"module\\""'
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'string',
        value: '\\"module\\"',
      })
    })

    test('unmatched value', () => {
      const wat = 'module'
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.matched).toBe(false)
    })
  })

  describe('sexpMatcher', () => {
    test('matched sexp of value', () => {
      const wat = '(module)'
      const matcher = sexpMatcher()
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'sexp',
        value: [
          {
            type: 'value',
            value: 'module',
          },
        ],
      })
    })

    test('matched multiple sexps of value', () => {
      const wat = '(module)(module)'
      const matcher = some(sexpMatcher())
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject([
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
          ],
        },
        {
          type: 'sexp',
          value: [
            {
              type: 'value',
              value: 'module',
            },
          ],
        },
      ])
    })

    test('matched nested sexps of value', () => {
      const wat = '(module(func))'
      const matcher = sexpMatcher()
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'sexp',
        value: [
          {
            type: 'value',
            value: 'module',
          },
          {
            type: 'sexp',
            value: [
              {
                type: 'value',
                value: 'func',
              },
            ],
          },
        ],
      })
    })

    test('matched sexp of multiple values', () => {
      const wat = '(module $m)'
      const matcher = sexpMatcher()
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'sexp',
        value: [
          {
            type: 'value',
            value: 'module',
          },
          {
            type: 'value',
            value: '$m',
          },
        ],
      })
    })

    test('unmatched value', () => {
      const wat = 'module'
      const matcher = sexpMatcher()
      const result = matcher(asInternalIterator(wat))

      expect(result.matched).toBe(false)
    })

    test('value, strings, block comments and line comments are distinguishable', () => {
      const wat = '(func"func"(;func;);;func\n)'
      const matcher = sexpMatcher({ trimChildren: [] })
      const result = matcher(asInternalIterator(wat))

      expect(result.value.value).toEqual([
        {
          type: 'value',
          value: 'func',
        },
        {
          type: 'string',
          value: 'func',
        },
        {
          type: 'block comment',
          value: [
            {
              type: 'block comment value',
              value: 'func',
            },
          ],
        },
        {
          type: 'line comment',
          value: 'func',
        },
      ])
    })
  })

  describe('block comments', () => {
    test('block comment', () => {
      const wat = '(;;)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [],
      })
    })

    test('block comment with value', () => {
      const wat = '(;abc;)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [
          {
            type: 'block comment value',
            value: 'abc',
          },
        ],
      })
    })

    test('nested block comments', () => {
      const wat = '(;aa(;bb;)cc;)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [
          {
            type: 'block comment value',
            value: 'aa',
          },
          {
            type: 'block comment',
            value: [
              {
                type: 'block comment value',
                value: 'bb',
              },
            ],
          },
          {
            type: 'block comment value',
            value: 'cc',
          },
        ],
      })
    })

    test('more nested block comments', () => {
      const wat = '(;(;(;;);)(;;)(;(;;););)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [
          {
            type: 'block comment',
            value: [{ type: 'block comment', value: [] }],
          },
          { type: 'block comment', value: [] },
          {
            type: 'block comment',
            value: [{ type: 'block comment', value: [] }],
          },
        ],
      })
    })
    test('line comments is just text within a block comment', () => {
      const wat = '(;;;line comment;;;)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [
          {
            type: 'block comment value',
            value: ';;line comment;;',
          },
        ],
      })
    })

    test('block comments can contain newlines', () => {
      const wat = '(;\n;)'
      const matcher = blockCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'block comment',
        value: [
          {
            type: 'block comment value',
            value: '\n',
          },
        ],
      })
    })
  })

  describe('line comment', () => {
    test('matched empty line comment', () => {
      const wat = ';;\n'
      const matcher = lineCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'line comment',
        value: '',
      })
    })

    test('matched line comment', () => {
      const wat = ';;todo write a comment\n'
      const matcher = lineCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toEqual({
        type: 'line comment',
        value: 'todo write a comment',
      })
    })

    test('unmatched value', () => {
      const wat = 'module'
      const matcher = lineCommentMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.matched).toBe(false)
    })
  })

  test('capture an sexp by tag', () => {
    const wat = `
      (component (;0;)
        (module (;1;))
      )
    `
    const parser = SexpParser({
      sourceTags: ['module'],
    })
    const result = parser(wat)
    const {
      value: [, { source }],
    } = result

    expect(source).toBe('(module (;1;))')
  })
})
