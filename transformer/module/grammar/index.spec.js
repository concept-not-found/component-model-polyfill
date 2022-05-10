import pipe from '../../pipe.js'
import { Parser as SexpParser } from '../../sexp/index.js'
import { module, name, kind, kindDefinition } from './index.js'

describe('module', () => {
  describe('grammar', () => {
    describe('a module is a sexp of imports, exports, and kind definitions', () => {
      test('a module can be empty', () => {
        const wat = '(module)'
        const result = pipe(SexpParser(), module)(wat)
        expect(result.value).toMatchObject({
          type: 'module',
          definitions: [],
        })
      })
    })

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
