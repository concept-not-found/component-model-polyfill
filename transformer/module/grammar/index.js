import { maybe, some, oneOf, when, matchPredicate, rest } from 'patcom'

import { sexp, value, string } from '../../sexp/index.js'

function parseIndex(index) {
  if (index.startsWith('$')) {
    return index
  }
  return Number.parseInt(index, 10)
}

const variable = value()
export const name = value()
export const identifier = value(
  matchPredicate((value) => value?.startsWith?.('$') ?? false)
)
const anyString = string()

export const kind = oneOf(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const kindName = [kind, maybe(name)]
export const kindDefinition = when(sexp(...kindName, rest), ([kind, name]) => {
  return {
    type: kind,
    name,
  }
})

const importName = [value('import'), anyString, anyString]
const importFirstDefinition = when(
  sexp(...importName, kindDefinition),
  ([, moduleName, importName, kindDefinition]) => {
    const { type, name } = kindDefinition
    return {
      type,
      name,
      import: {
        moduleName,
        name: importName,
      },
    }
  }
)
const inlineImportDefinition = when(
  sexp(...kindName, sexp(...importName)),
  ([type, name, [, moduleName, importName]]) => {
    return {
      type,
      name,
      import: {
        moduleName,
        name: importName,
      },
    }
  }
)
const importDefinition = oneOf(importFirstDefinition, inlineImportDefinition)

const kindReference = when(sexp(kind, variable), ([kind, kindIdx]) => {
  return {
    kind,
    kindIdx: parseIndex(kindIdx),
  }
})

const exportName = [value('export'), anyString]
const exportDefinition = when(
  sexp(...exportName, kindReference),
  ([, name, kindReference]) => {
    return {
      type: 'export',
      name,
      kindReference,
    }
  }
)

const definition = oneOf(importDefinition, kindDefinition, exportDefinition)
export const module = when(
  sexp(value('module'), maybe(identifier), maybe(some(definition))),
  (
    [, name, definitions = []],
    {
      result: {
        rest: {
          value: { source },
        },
      },
    }
  ) => {
    return {
      type: 'module',
      name,
      definitions,
      source,
    }
  }
)
