import kindCollection from '../../kind-collection.js'

import { group, maybe, some, rest, oneOf, when } from 'patcom'

import { sexp, value, string, reference } from '../../sexp/index.js'

import { module } from '../../module/index.js'

function parseIndex(index) {
  if (index.startsWith('$')) {
    return index
  }
  return Number.parseInt(index, 10)
}

const variable = value()
const name = value()
const anyString = string()

const kind = oneOf(...Object.keys(kindCollection).map(value))

const kindName = [kind, maybe(name)]
const kindDefinition = when(sexp(...kindName), ([type, name]) => {
  return {
    type,
    name,
  }
})

const kindTypeReference = reference()
const exportType = when(
  sexp(value('export'), anyString, kindTypeReference),
  ([, name, kindType]) => {
    return {
      name,
      kindType,
    }
  }
)

const instanceType = when(
  sexp(value('instance'), maybe(name), maybe(some(exportType))),
  ([, name, exports = []]) => {
    return {
      type: 'instance',
      name,
      instanceExpression: {
        type: 'tupling',
        exports,
      },
    }
  }
)

const importType = sexp(value('import'), anyString, kindTypeReference)
const componentType = when(
  sexp(
    value('component'),
    maybe(name),
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imports = [], exports = []]) => {
    return {
      type: 'component',
      name,
      imports,
      exports,
    }
  }
)
const moduleType = when(
  sexp(
    value('module'),
    maybe(name),
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imports = [], exports = []]) => {
    return {
      type: 'module',
      name,
      imports,
      exports,
    }
  }
)

const coreKind = oneOf(
  value('func'),
  value('memory'),
  value('table'),
  value('global')
)
const coreKindName = [coreKind, maybe(name)]
const coreKindType = when(sexp(...coreKindName, rest), ([type, name]) => {
  return {
    type,
    name,
  }
})

const kindType = oneOf(coreKindType, instanceType, componentType, moduleType)
kindTypeReference.matcher = kindType

const importName = [value('import'), anyString]
const importFirstForm = when(
  sexp(...importName, kindType),
  ([, name, kindType]) => {
    return {
      ...kindType,
      import: {
        name,
      },
    }
  }
)

const inlineImport = when(sexp(...importName), ([, name]) => {
  return {
    name,
  }
})

const coreKindTypeInlineImport = when(
  sexp(coreKind, maybe(name), inlineImport, rest),
  ([type, name, imp]) => {
    return {
      type,
      name,
      import: imp,
    }
  }
)

const instanceTypeInlineImport = when(
  sexp(value('instance'), maybe(name), inlineImport, maybe(some(exportType))),
  ([, name, imp, exports = []]) => {
    return {
      type: 'instance',
      name,
      import: imp,
      instanceExpression: {
        type: 'tupling',
        exports,
      },
    }
  }
)

const componentTypeInlineImport = when(
  sexp(
    value('component'),
    maybe(name),
    inlineImport,
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imp, imports = [], exports = []]) => {
    return {
      type: 'component',
      name,
      import: imp,
      imports,
      exports,
    }
  }
)

const moduleTypeInlineImport = when(
  sexp(
    value('module'),
    maybe(name),
    inlineImport,
    maybe(some(importType)),
    maybe(some(exportType))
  ),
  ([, name, imp, imports = [], exports = []]) => {
    return {
      type: 'module',
      name,
      import: imp,
      imports,
      exports,
    }
  }
)

const inlineImportForm = oneOf(
  coreKindTypeInlineImport,
  instanceTypeInlineImport,
  componentTypeInlineImport,
  moduleTypeInlineImport
)
const importDefinition = oneOf(importFirstForm, inlineImportForm)

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

const withName = [value('with'), anyString]

const componentArgumentReference = reference()
const instanceExport = when(
  sexp(...exportName, componentArgumentReference),
  ([, name, argument]) => {
    return {
      name,
      ...argument,
    }
  }
)

const kindReferenceArgument = when(kindReference, (reference) => {
  return {
    type: 'reference',
    reference,
  }
})
const instanceExports = maybe(some(instanceExport))
const inlineInstanceArgument = when(
  sexp(value('instance'), instanceExports),
  ([, exports = []]) => {
    return {
      type: 'inline instance',
      exports,
    }
  }
)

componentArgumentReference.matcher = oneOf(
  kindReferenceArgument,
  inlineInstanceArgument
)

const withComponentArgument = when(
  sexp(...withName, componentArgumentReference),
  ([, name, argument]) => {
    return {
      name,
      ...argument,
    }
  }
)

const instanceInstantiateComponent = when(
  sexp(
    value('instantiate'),
    sexp(value('component'), variable),
    maybe(some(withComponentArgument))
  ),
  ([, [, componentIdx], args = []]) => {
    return {
      type: 'instantiate component',
      componentIdx: parseIndex(componentIdx),
      arguments: args,
    }
  }
)

const instanceReference = when(
  sexp(value('instance'), variable),
  ([, kindIdx]) => {
    return {
      type: 'reference',
      reference: {
        kind: 'instance',
        kindIdx: parseIndex(kindIdx),
      },
    }
  }
)
const inlineCoreInstanceArgument = when(
  sexp(value('instance'), coreKindType),
  ([, exports = []]) => {
    return {
      type: 'inline instance',
      exports,
    }
  }
)

const moduleArgument = oneOf(instanceReference, inlineCoreInstanceArgument)

const withModuleArgument = when(
  sexp(...withName, moduleArgument),
  ([, name, argument]) => {
    return {
      name,
      ...argument,
    }
  }
)

const instanceInstantiateModule = when(
  sexp(
    value('instantiate'),
    sexp(value('module'), variable),
    maybe(some(withModuleArgument))
  ),
  ([, [, moduleIdx], args = []]) => {
    return {
      type: 'instantiate module',
      moduleIdx: parseIndex(moduleIdx),
      arguments: args,
    }
  }
)

const instanceTupling = when(instanceExports, (exports = []) => {
  return {
    type: 'tupling',
    exports,
  }
})

const instanceExpression = oneOf(
  instanceInstantiateComponent,
  instanceInstantiateModule,
  instanceTupling
)
const instanceDefinition = when(
  sexp(value('instance'), maybe(name), instanceExpression),
  ([, name, instanceExpression]) => {
    return {
      type: 'instance',
      name,
      instanceExpression,
    }
  }
)

const instanceExportAlias = when(
  group(variable, anyString),
  ([instanceIdx, name]) => {
    return {
      type: 'instance export',
      instanceIdx: parseIndex(instanceIdx),
      name,
    }
  }
)

const outerAlias = when(group(variable, variable), ([outerIdx, kindIdx]) => {
  return {
    type: 'outer',
    outerIdx: parseIndex(outerIdx),
    kindIdx: parseIndex(kindIdx),
  }
})

const aliasTarget = oneOf(instanceExportAlias, outerAlias)
const aliasFirstForm = when(
  sexp(value('alias'), aliasTarget, kindDefinition),
  ([, aliasTarget, kindDefinition]) => {
    return {
      ...kindDefinition,
      alias: aliasTarget,
    }
  }
)
const inlineAliasForm = when(
  sexp(...kindName, sexp(value('alias'), aliasTarget)),
  ([type, name, [, aliasTarget]]) => {
    return {
      type,
      name,
      alias: aliasTarget,
    }
  }
)
const aliasDefinition = oneOf(aliasFirstForm, inlineAliasForm)

const componentReference = reference()
const definition = oneOf(
  importDefinition,
  instanceDefinition,
  aliasDefinition,
  exportDefinition,
  module,
  componentReference,
  sexp(rest)
)

export const component = when(
  sexp(value('component'), maybe(name), maybe(some(definition)), rest),
  ([, name, definitions = []]) => {
    return {
      type: 'component',
      name,
      definitions,
    }
  }
)
componentReference.matcher = component
