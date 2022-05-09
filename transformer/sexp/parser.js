import {
  rest,
  match,
  asInternalIterator,
  IteratorMatcher,
  maybe,
  group,
  oneOf,
  some,
  not,
  when,
  otherwise,
} from 'patcom'

import { reference } from './grammar/index.js'

const lineEnding = oneOf(group('\r', '\n'), '\r', '\n')
const sexpStart = '('
const sexpEnd = ')'
const whitespace = oneOf(' ', '\t', lineEnding)
const stringDeliminator = '"'
const blockCommentStart = group('(', ';')
const blockCommentEnd = group(';', ')')
const lineCommentStart = group(';', ';')
const deliminators = oneOf(
  sexpStart,
  sexpEnd,
  whitespace,
  stringDeliminator,
  blockCommentStart,
  blockCommentEnd,
  lineCommentStart
)
export const valueMatcher = when(some(not(deliminators)), (value) => {
  return {
    type: 'value',
    value: value.join(''),
  }
})

export const stringMatcher = when(
  group(
    stringDeliminator,
    maybe(some(oneOf(group('\\', '"'), not(stringDeliminator)))),
    stringDeliminator
  ),
  ([, value = []]) => {
    return {
      type: 'string',
      value: value.flat().join(''),
    }
  }
)

const whitespaceMatcher = when(some(whitespace), (value) => {
  return {
    type: 'whitespace',
    value: value.join(''),
  }
})

const nestedBlockComment = reference()

export const blockCommentMatcher = when(
  group(blockCommentStart, maybe(some(nestedBlockComment)), blockCommentEnd),
  ([, value = []]) => {
    return {
      type: 'block comment',
      value,
    }
  }
)

const blockCommentValueMatcher = when(
  some(not(oneOf(blockCommentStart, blockCommentEnd))),
  (value) => {
    return {
      type: 'block comment value',
      value: value.join(''),
    }
  }
)

nestedBlockComment.matcher = oneOf(
  blockCommentMatcher,
  blockCommentValueMatcher
)

const endOfFile = IteratorMatcher((iterator) => {
  const { done } = iterator.next()
  return {
    matched: done,
  }
})

export const lineCommentMatcher = when(
  group(
    lineCommentStart,
    maybe(some(not(lineEnding))),
    oneOf(lineEnding, endOfFile)
  ),
  ([, value = []]) => {
    return {
      type: 'line comment',
      value: value.flat().join(''),
    }
  }
)

const Sourceable =
  (sourceTags = []) =>
  (matcher) =>
    IteratorMatcher((iterator) => {
      const start = iterator.now
      const result = matcher(iterator)
      const end = iterator.now

      return match(result)(
        when(
          {
            matched: true,
            value: [
              sexpStart,
              [{ type: 'value', value: oneOf(...sourceTags) }, rest],
              rest,
            ],
            rest,
          },
          () => {
            const time = iterator.now
            const source = []
            iterator.jump(start)
            for (let index = start; index < end; index++) {
              source.push(iterator.next().value)
            }
            iterator.jump(time)

            return {
              ...result,
              source: source.join(''),
            }
          }
        ),
        otherwise(() => result)
      )
    })

export const SexpMatcher = ({
  sourceTags,
  trimTypes = ['block comment', 'line comment', 'whitespace'],
} = {}) => {
  const nestedSexp = reference()

  const sourceable = Sourceable(sourceTags)

  const sexpMatcherInstance = when(
    sourceable(group(sexpStart, maybe(some(nestedSexp)), sexpEnd)),
    ([, children = []], { source }) => {
      const result = {
        type: 'sexp',
        value: children.filter(({ type }) => !trimTypes.includes(type)),
        source,
      }
      return result
    }
  )

  nestedSexp.matcher = oneOf(
    blockCommentMatcher,
    sexpMatcherInstance,
    lineCommentMatcher,
    stringMatcher,
    whitespaceMatcher,
    valueMatcher
  )
  return sexpMatcherInstance
}

export default (...parameters) =>
  (wat) =>
    match(asInternalIterator(wat))(
      when(
        group(
          maybe(whitespaceMatcher),
          maybe(SexpMatcher(...parameters)),
          maybe(whitespaceMatcher),
          endOfFile
        ),
        ([, sexp]) => sexp
      )
    )
