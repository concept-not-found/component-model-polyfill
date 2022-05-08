import { when, defined, rest, IteratorMatcher } from 'patcom'

export const sexp = (...expected) =>
  when({ type: 'sexp', value: expected, rest }, ({ value }) => value)

export const value = (expected = defined) =>
  when({ type: 'value', value: expected }, ({ value }) => value)

export const string = (expected = defined) =>
  when({ type: 'string', value: expected }, ({ value }) => value)

export const reference = () => {
  const referenceMatcher = IteratorMatcher((iterator) => {
    if (!referenceMatcher.matcher) {
      throw new Error('reference.matcher has not been set yet')
    }
    return referenceMatcher.matcher(iterator)
  })

  Object.defineProperty(referenceMatcher, 'matcher', {
    matcher: undefined,
    writable: true,
  })
  return referenceMatcher
}
