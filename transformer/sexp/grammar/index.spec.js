import { sexp, value, reference } from './index.js'

describe('grammar', () => {
  describe('reference to a matcher to allow for cirular depedencies', () => {
    test('reference can be used and later have the real matcher set on as the field', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)

      valueReference.matcher = value('module')

      const result = matcher({
        type: 'sexp',
        value: [{ type: 'value', value: 'module' }],
      })
      expect(result.matched).toBe(true)
    })

    test('throws when matcher has not been set yet', () => {
      const valueReference = reference()
      const matcher = sexp(valueReference)

      expect(() =>
        matcher({
          type: 'sexp',
          value: [{ type: 'value', value: 'module' }],
        })
      ).toThrow()
    })
  })
})
