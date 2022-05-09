import { asInternalIterator } from 'patcom'

import SexpParser, {
  valueMatcher,
  stringMatcher,
  SexpMatcher,
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
      { wat: 'foo\tbar', deliminator: 'whitespace' },
      { wat: 'foo\r\nbar', deliminator: 'whitespace' },
      { wat: 'foo\rbar', deliminator: 'whitespace' },
      { wat: 'foo\nbar', deliminator: 'whitespace' },
      { wat: 'foo"bar', deliminator: 'string' },
      { wat: 'foo(;bar', deliminator: 'start of block comment' },
      { wat: 'foo;)bar', deliminator: 'end of block comment' },
      { wat: 'foo;;bar', deliminator: 'line comment' },
    ])('matched “$wat” as “foo” due to $deliminator deliminator', ({ wat }) => {
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
      { wat: '\tfoo', deliminator: 'whitespace' },
      { wat: '\r\nfoo', deliminator: 'whitespace' },
      { wat: '\rfoo', deliminator: 'whitespace' },
      { wat: '\nfoo', deliminator: 'whitespace' },
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

  describe('stringMatcher matches anything between double quotes “"”', () => {
    test.each([
      { wat: '""', value: '' },
      { wat: '"foo"', value: 'foo' },
    ])('matched “$wat” as “$value”', ({ wat, value }) => {
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'string',
        value,
      })
    })

    test('matched “"foo\\""” as “foo"” as double quotes can be escaped with “\\"”', () => {
      const wat = '"foo\\""'
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'string',
        value: 'foo\\"',
      })
    })

    test.each([
      { wat: 'foo', reason: 'missing double quotes' },
      { wat: '"foo', reason: 'missing end double quote' },
      { wat: 'foo"', reason: 'missing start double quote' },
    ])('unmatched “$wat” due to $reason', ({ wat }) => {
      const matcher = stringMatcher
      const result = matcher(asInternalIterator(wat))

      expect(result.matched).toBe(false)
    })
  })

  describe('SexpMatcher matches nested items between left parenthesis “(” and right parenthesis “)”', () => {
    test.each([
      { wat: '()', value: [], reason: 'sexp nests nothing' },
      {
        wat: '(foo)',
        value: [{ type: 'value', value: 'foo' }],
        reason: 'sexp can nest a value',
      },
      {
        wat: '(())',
        value: [{ type: 'sexp', value: [] }],
        reason: 'sexp can nest another sexp',
      },
      {
        wat: '(foo bar)',
        value: [
          { type: 'value', value: 'foo' },
          { type: 'value', value: 'bar' },
        ],
        reason: 'sexp can nest multiple values deliminated by whitespace',
      },
      {
        wat: '(value "string" (nested) (;block comment;) ;;line comment\n)',
        value: [
          { type: 'value', value: 'value' },
          { type: 'string', value: 'string' },
          { type: 'sexp', value: [{ type: 'value', value: 'nested' }] },
          {
            type: 'block comment',
            value: [{ type: 'block comment value', value: 'block comment' }],
          },
          { type: 'line comment', value: 'line comment' },
        ],
        reason: 'sexp can nest items of all kinds',
      },
    ])('matched “$wat” as $reason', ({ wat, value }) => {
      const matcher = SexpMatcher({ trimTypes: ['whitespace'] })
      const result = matcher(asInternalIterator(wat))

      expect(result.value).toMatchObject({
        type: 'sexp',
        value,
      })
    })

    test.each([
      { wat: 'foo)', reason: 'missing starting left parenthesis “(”' },
      { wat: '(foo', reason: 'missing ending right parenthesis “)”' },
      { wat: ')(', reason: 'cannot start with right parenthesis “)”' },
    ])('unmatched “$wat” as $reason', ({ wat }) => {
      const matcher = SexpMatcher()
      const result = matcher(asInternalIterator(wat))

      expect(result.matched).toBe(false)
    })

    describe('sourceTags option captures original source of sexp to the source field, when first nested value is in the sourceTags array', () => {
      test('by default nothing is capatured if no sourceTags are provided', () => {
        const wat = '(some-tag some-value\nsome-value-after-newline)'
        const matcher = SexpMatcher()
        const result = matcher(asInternalIterator(wat))

        expect(result.source).toBeUndefined()
      })

      test('original source including whitespace is captured when tag is within sourceTags', () => {
        const wat = '(some-tag some-value\nsome-value-after-newline)'
        const matcher = SexpMatcher({ sourceTags: ['some-tag'] })
        const result = matcher(asInternalIterator(wat))

        expect(result.source).toBe(
          '(some-tag some-value\nsome-value-after-newline)'
        )
      })

      test('nested sexp source can be captured', () => {
        const wat = '(some-containg-sexp (some-tag some-value))'
        const matcher = SexpMatcher({ sourceTags: ['some-tag'] })
        const result = matcher(asInternalIterator(wat))

        expect(result.source).toBeUndefined()
        expect(result.value.value[1].source).toBe('(some-tag some-value)')
      })

      test('multiple sourceTags can be provided to capture different sexp', () => {
        const wat = '((first-tag) (second-tag) (but-not-third-tag))'
        const matcher = SexpMatcher({ sourceTags: ['first-tag', 'second-tag'] })
        const result = matcher(asInternalIterator(wat))

        expect(result.value.value[0].source).toBe('(first-tag)')
        expect(result.value.value[1].source).toBe('(second-tag)')
        expect(result.value.value[2].source).toBeUndefined()
      })

      test('a single sourceTags can capture different sexp', () => {
        const wat = '((some-tag some-value) (some-tag some-other-value))'
        const matcher = SexpMatcher({ sourceTags: ['some-tag'] })
        const result = matcher(asInternalIterator(wat))

        expect(result.value.value[0].source).toBe('(some-tag some-value)')
        expect(result.value.value[1].source).toBe('(some-tag some-other-value)')
      })
    })
    describe('trimTypes option removes nested items of matching type', () => {
      test('by default block comment, line comment and whitespace are removed', () => {
        const wat =
          '(some-value "some string" (some-nested-sexp) (;block comment;) ;;line comment\n)'
        const matcher = SexpMatcher()
        const result = matcher(asInternalIterator(wat))

        expect(result.value).toMatchObject({
          type: 'sexp',
          value: [
            { type: 'value', value: 'some-value' },
            { type: 'string', value: 'some string' },
            {
              type: 'sexp',
              value: [{ type: 'value', value: 'some-nested-sexp' }],
            },
          ],
        })
      })

      test('everything can be retained by trimming no types', () => {
        const wat =
          '(some-value "some string" (some-nested-sexp) (;block comment;) ;;line comment\n)'
        const matcher = SexpMatcher({ trimTypes: [] })
        const result = matcher(asInternalIterator(wat))

        expect(result.value).toMatchObject({
          type: 'sexp',
          value: [
            { type: 'value', value: 'some-value' },
            { type: 'whitespace', value: ' ' },
            { type: 'string', value: 'some string' },
            { type: 'whitespace', value: ' ' },
            {
              type: 'sexp',
              value: [{ type: 'value', value: 'some-nested-sexp' }],
            },
            { type: 'whitespace', value: ' ' },
            {
              type: 'block comment',
              value: [{ type: 'block comment value', value: 'block comment' }],
            },
            { type: 'whitespace', value: ' ' },
            { type: 'line comment', value: 'line comment' },
          ],
        })
      })
    })
  })

  describe('SexpParser parses a single sexp', () => {
    test('surrounding whitespace is ignored', () => {
      const wat = ' (note-leading-and-trailing-whitespace) '
      const parser = SexpParser()
      const result = parser(wat)

      expect(result).toMatchObject({
        type: 'sexp',
        value: [
          {
            type: 'value',
            value: 'note-leading-and-trailing-whitespace',
          },
        ],
      })
    })

    test.each([
      { wat: 'value', reason: 'top-level item must be a sexp' },
      { wat: '(first)(second)', reason: 'too many top-level sexps' },
    ])('fails to parse $wat due to $reason', ({ wat }) => {
      const parser = SexpParser()
      const result = parser(wat)

      expect(result).toBeUndefined()
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
})
