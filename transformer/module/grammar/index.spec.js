import { name, kind, kindDefinition } from './index.js'

describe('core module', () => {
  describe('grammar', () => {
    describe('name', () => {
      test('func', () => {
        const matcher = name
        const result = matcher({ type: 'value', value: '$f' })
        expect(result).toMatchObject({
          matched: true,
          value: '$f',
        })
      })
    })
    describe('kind', () => {
      test('func', () => {
        const matcher = kind
        const result = matcher({ type: 'value', value: 'func' })
        expect(result).toMatchObject({
          matched: true,
          value: 'func',
        })
      })
    })
    describe('kindDefinition', () => {
      test('named func', () => {
        const matcher = kindDefinition
        const result = matcher({
          type: 'sexp',
          value: [
            { type: 'value', value: 'func' },
            { type: 'value', value: '$f' },
          ],
        })
        expect(result).toMatchObject({
          matched: true,
          value: {
            type: 'func',
            name: '$f',
          },
        })
      })
    })
  })
})
