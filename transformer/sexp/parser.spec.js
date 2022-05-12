import Parser from './parser.js'

describe('parser', () => {
  describe('values are deliminated', () => {
    test.each([
      { wat: '(foo())', deliminator: 'start of sexp' },
      { wat: '(foo)', deliminator: 'end of sexp' },
      { wat: '(foo ())', deliminator: 'whitespace' },
      { wat: '(foo\t())', deliminator: 'whitespace' },
      { wat: '(foo\r\n())', deliminator: 'whitespace' },
      { wat: '(foo\r())', deliminator: 'whitespace' },
      { wat: '(foo\n())', deliminator: 'whitespace' },
      { wat: '(foo"")', deliminator: 'string' },
      { wat: '(foo(;;))', deliminator: 'start of block comment' },
      { wat: '(foo;;\n)', deliminator: 'line comment' },
    ])(
      'first item in “$wat” is value “foo” due to $deliminator deliminator',
      ({ wat }) => {
        const result = Parser()(wat)

        expect(result.value[0]).toEqual({
          type: 'value',
          value: 'foo',
        })
      }
    )
  })

  describe('strings are anything between double quotes “"”', () => {
    test.each([
      { wat: '""', value: '', reason: 'empty string' },
      {
        wat: '"foo\nbar"',
        value: 'foo\nbar',
        reason: 'string can contain newlines',
      },
      {
        wat: '"foo (bar)"',
        value: 'foo (bar)',
        reason: 'strings can contain anything',
      },
      {
        wat: '"foo\\""',
        value: 'foo\\"',
        reason: 'double quotes “"” being escaped with “\\"”',
      },
    ])('matched “$wat” as “$value” due to $reason', ({ wat, value }) => {
      const result = Parser()(`(${wat})`)

      expect(result.value[0]).toEqual({
        type: 'string',
        value,
      })
    })

    test.each([{ wat: '"foo', reason: 'missing end double quote' }])(
      'fails to parse “$wat” due to $reason',
      ({ wat }) => {
        const result = Parser()(`(${wat})`)

        expect(result).toBe(undefined)
      }
    )
  })

  describe('sexp matches nested items between left parenthesis “(” and right parenthesis “)”', () => {
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
      {
        wat: ' (note-leading-and-trailing-whitespace) ',
        value: [
          {
            type: 'value',
            value: 'note-leading-and-trailing-whitespace',
          },
        ],
        reason: 'surrounding whitespace is ignored',
      },
    ])('parses “$wat” due to $reason', ({ wat, value }) => {
      const result = Parser({ trimTypes: ['whitespace'] })(wat)

      expect(result).toEqual({
        type: 'sexp',
        value,
      })
    })

    test.each([
      { wat: 'foo)', reason: 'missing starting left parenthesis “(”' },
      { wat: '(foo', reason: 'missing ending right parenthesis “)”' },
      { wat: ')(', reason: 'cannot start with right parenthesis “)”' },
      { wat: 'value', reason: 'top-level item must be a sexp' },
      { wat: '(first)(second)', reason: 'too many top-level sexps' },
    ])('fails to parse “$wat” due to $reason', ({ wat }) => {
      const result = Parser()(wat)

      expect(result).toBe(undefined)
    })

    describe('sourceTags option captures original source of sexp to the source field, when first nested value is in the sourceTags array', () => {
      test('by default nothing is capatured if no sourceTags are provided', () => {
        const wat = '(some-tag some-value\nsome-value-after-newline)'
        const result = Parser()(wat)

        expect(result.source).toBeUndefined()
      })

      test('original source including whitespace is captured when tag is within sourceTags', () => {
        const wat = '(some-tag some-value\nsome-value-after-newline)'
        const result = Parser({ sourceTags: ['some-tag'] })(wat)

        expect(result.source).toBe(
          '(some-tag some-value\nsome-value-after-newline)'
        )
      })

      test('nested sexp source can be captured', () => {
        const wat = '(some-containg-sexp (some-tag some-value))'
        const result = Parser({ sourceTags: ['some-tag'] })(wat)

        expect(result.source).toBeUndefined()
        expect(result.value[1].source).toBe('(some-tag some-value)')
      })

      test('multiple sourceTags can be provided to capture different sexp', () => {
        const wat = '((first-tag) (second-tag) (but-not-third-tag))'
        const result = Parser({ sourceTags: ['first-tag', 'second-tag'] })(wat)

        expect(result.value[0].source).toBe('(first-tag)')
        expect(result.value[1].source).toBe('(second-tag)')
        expect(result.value[2].source).toBeUndefined()
      })

      test('a single sourceTags can capture different sexp', () => {
        const wat = '((some-tag some-value) (some-tag some-other-value))'
        const result = Parser({ sourceTags: ['some-tag'] })(wat)

        expect(result.value[0].source).toBe('(some-tag some-value)')
        expect(result.value[1].source).toBe('(some-tag some-other-value)')
      })
    })

    describe('trimTypes option removes nested items of matching type', () => {
      test('by default block comment, line comment and whitespace are removed', () => {
        const wat =
          '(some-value "some string" (some-nested-sexp) (;block comment;) ;;line comment\n)'
        const result = Parser()(wat)

        expect(result).toEqual({
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
        const result = Parser({ trimTypes: [] })(wat)

        expect(result).toEqual({
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

  describe('block comments are multi-line comments surrounded by “(;” and “;)”', () => {
    test.each([
      { wat: '(;;)', value: [], reason: 'block comment able to be empty' },
      {
        wat: '(;foo (bar);)',
        value: [{ type: 'block comment value', value: 'foo (bar)' }],
        reason: 'block comment able to contain anything',
      },
      {
        wat: '(;foo\nbar;)',
        value: [{ type: 'block comment value', value: 'foo\nbar' }],
        reason: 'block comment able to contain newlines',
      },
      {
        wat: '(;foo(;bar;)baz;)',
        value: [
          { type: 'block comment value', value: 'foo' },
          {
            type: 'block comment',
            value: [{ type: 'block comment value', value: 'bar' }],
          },
          { type: 'block comment value', value: 'baz' },
        ],
        reason: 'nested block comment',
      },
      {
        wat: '(;(;foo;)bar(;baz;);)',
        value: [
          {
            type: 'block comment',
            value: [{ type: 'block comment value', value: 'foo' }],
          },
          { type: 'block comment value', value: 'bar' },
          {
            type: 'block comment',
            value: [{ type: 'block comment value', value: 'baz' }],
          },
        ],
        reason: 'nested block comment',
      },
      {
        wat: '(; ;; foo ;)\n',
        value: [{ type: 'block comment value', value: ' ;; foo ' }],
        reason: 'block comment taking presedent over line comment',
      },
    ])('matched “$wat” due to $reason', ({ wat, value }) => {
      const result = Parser({ trimTypes: ['whitespace'] })(`(${wat})`)

      expect(result.value[0]).toEqual({
        type: 'block comment',
        value,
      })
    })

    test.each([
      {
        wat: 'foo;)',
        reason: 'missing starting “(;”',
      },
      {
        wat: '(;foo',
        reason: 'missing ending “;)”',
      },
      {
        wat: ';)(;',
        reason: '“(;” must come before “;)“',
      },
      {
        wat: '(;(;foo;)',
        reason: 'block comment requiring proper nesting',
      },
      {
        wat: '(;foo;);)',
        reason: 'block comment requiring proper nesting',
      },
    ])('unmatched “$wat” due to $reason', ({ wat, value }) => {
      const result = Parser()(`(${wat})`)

      expect(result).toBe(undefined)
    })
  })

  describe('line comments are anything between “;;“ and end of line', () => {
    test.each([
      { wat: '(;;\n)', value: '', reason: 'line comment able to match empty' },
      {
        wat: '(;;foo (bar) (;baz;)\n)',
        value: 'foo (bar) (;baz;)',
        reason: 'line comment able to match anything',
      },
    ])('parses “$wat” as “$value” due to $reason', ({ wat, value }) => {
      const result = Parser({ trimTypes: [] })(wat)

      expect(result.value[0]).toEqual({
        type: 'line comment',
        value,
      })
    })

    test('parses “();; foo” due to end of file counts as end of line', () => {
      const wat = '();; foo'
      const result = Parser({ trimTypes: [] })(wat)

      expect(result).toEqual({
        type: 'sexp',
        value: [],
      })
    })
  })
})
