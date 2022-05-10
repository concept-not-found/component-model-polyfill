import { index as indexModule } from '../module/index.js'
import kindCollection from '../kind-collection.js'

// declared empty to avoid no-use-before-define
// eslint-disable-next-line prefer-const
let component

function resolveIndex(componentNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  return typeof kindIdx === 'number'
    ? kindIdx
    : componentNode.symbolIndex[collection][kindIdx]
}

function resolveOuterIndex(ancestors, outerIdx) {
  if (typeof outerIdx === 'number') {
    return outerIdx
  }

  for (const [index, { name }] of [...ancestors].reverse().entries()) {
    if (outerIdx === name) {
      return index
    }
  }
  throw new Error(`failed to resolved outer index ${outerIdx} to an component`)
}

function resolve(componentNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  const index = resolveIndex(componentNode, kind, kindIdx)
  return componentNode[collection][index]
}

function directPath(componentNode, kind, kindIdx) {
  const collection = kindCollection[kind]
  return [collection, resolveIndex(componentNode, kind, kindIdx)]
}

function resolvePath(componentNode, kind, kindIdx, ancestors) {
  const { import: imp, alias, path } = resolve(componentNode, kind, kindIdx)
  if (!imp && !alias) {
    return directPath(componentNode, kind, kindIdx)
  }
  return path(ancestors)
}

const indexAliases = (componentNode) => {
  for (const node of componentNode.aliases) {
    const { alias } = node
    switch (alias.type) {
      case 'instance export':
        Object.defineProperty(node, 'path', {
          value() {
            const kind = 'instance'
            const { instanceIdx, name } = alias
            return [
              ...directPath(componentNode, kind, instanceIdx),
              'exports',
              name,
            ]
          },
        })
        break
      case 'outer':
        Object.defineProperty(node, 'path', {
          value(ancestors) {
            const { type: kind } = node
            let { outerIdx } = alias
            outerIdx = resolveOuterIndex(ancestors, outerIdx)
            const { kindIdx } = alias
            const outerModuleIdx = ancestors.length - 1 - outerIdx
            const outerModule = ancestors[outerModuleIdx]
            const aliased = resolve(outerModule, kind, kindIdx)
            return [
              ...Array.from({ length: outerIdx }).fill('..'),
              ...aliased.path(ancestors.slice(0, -outerIdx)),
            ]
          },
        })
        break
    }
  }
  delete componentNode.aliases
}

const indexComponents = (componentNode) => {
  const concreteComponents = componentNode.components.filter(
    ({ import: imp, alias }) => !imp && !alias
  )
  for (const [componentIdx, node] of concreteComponents.entries()) {
    Object.defineProperty(node, 'path', {
      value() {
        return ['components', componentIdx]
      },
    })
  }
  for (const node of concreteComponents) {
    component(node)
  }
}

const indexModules = (componentNode) => {
  const concreteModules = componentNode.modules.filter(
    ({ import: imp, alias }) => !imp && !alias
  )
  for (const [moduleIdx, node] of concreteModules.entries()) {
    Object.defineProperty(node, 'path', {
      value() {
        return ['modules', moduleIdx]
      },
    })
  }
  for (const node of concreteModules) {
    indexModule(node)
  }
}

const indexDefinitions = (componentNode) => {
  const matchers = [
    ...Object.entries({ ...kindCollection, export: 'exports' }).map(
      ([kind, collection]) => [collection, ({ type }) => type === kind]
    ),
    ['components', ({ type }) => type === 'component'],
    ['modules', ({ type }) => type === 'module'],
    ['imports', ({ import: imp }) => imp],
    ['aliases', ({ alias }) => alias],
  ]
  for (const [collection, matcher] of matchers) {
    componentNode[collection] = componentNode.definitions.filter(matcher)
  }
  delete componentNode.definitions
}

const indexSymbols = (componentNode) => {
  componentNode.symbolIndex = {}
  for (const collection of Object.values(kindCollection)) {
    componentNode.symbolIndex[collection] = {}

    for (const [kindIdx, { name }] of componentNode[collection].entries()) {
      if (typeof name === 'string') {
        componentNode.symbolIndex[collection][name] = kindIdx
      }
    }
  }
}

const indexExports = (componentNode) => {
  for (const { kindReference } of componentNode.exports) {
    Object.defineProperty(kindReference, 'path', {
      value(ancestors) {
        const { kind, kindIdx } = kindReference
        return resolvePath(componentNode, kind, kindIdx, ancestors)
      },
    })
  }
}

const indexInstances = (componentNode) => {
  const concreteInstances = componentNode.instances.filter(
    ({ import: imp, alias }) => !imp && !alias
  )
  for (const [instanceIdx, instance] of concreteInstances.entries()) {
    Object.defineProperty(instance, 'path', {
      value() {
        return ['instances', instanceIdx]
      },
    })
  }
  for (const { instanceExpression } of concreteInstances) {
    switch (instanceExpression.type) {
      case 'instantiate component':
        Object.defineProperty(instanceExpression, 'componentPath', {
          value(ancestors) {
            const kind = 'component'
            return resolvePath(
              componentNode,
              kind,
              instanceExpression.componentIdx,
              ancestors
            )
          },
        })
        for (const { type, reference } of instanceExpression.arguments) {
          if (type !== 'reference') {
            throw new Error(
              `instantiate module argument of type ${type} not implemented yet`
            )
          }
          Object.defineProperty(reference, 'path', {
            value(ancestors) {
              const { kind, kindIdx } = reference
              const imported = resolve(componentNode, kind, kindIdx)
              return imported.path(ancestors)
            },
          })
        }
        break
      case 'instantiate module':
        Object.defineProperty(instanceExpression, 'modulePath', {
          value(ancestors) {
            const kind = 'module'
            return resolvePath(
              componentNode,
              kind,
              instanceExpression.moduleIdx,
              ancestors
            )
          },
        })
        for (const { type, reference } of instanceExpression.arguments) {
          if (type !== 'reference') {
            throw new Error(
              `instantiate module argument of type ${type} not implemented yet`
            )
          }
          Object.defineProperty(reference, 'path', {
            value(ancestors) {
              const { kind, kindIdx } = reference
              const imported = resolve(componentNode, kind, kindIdx)
              return imported.path(ancestors)
            },
          })
        }
        break
      case 'tupling':
        for (const { type, reference } of instanceExpression.exports) {
          if (type !== 'reference') {
            throw new Error(
              `instantiate module argument of type ${type} not implemented yet`
            )
          }
          Object.defineProperty(reference, 'path', {
            value(ancestors) {
              const { kind, kindIdx } = reference
              const exported = resolve(componentNode, kind, kindIdx)
              return exported.path(ancestors)
            },
          })
        }
        break
    }
  }
}

const indexImports = (componentNode) => {
  for (const imp of componentNode.imports) {
    Object.defineProperty(imp, 'path', {
      value() {
        const {
          import: { name },
        } = imp
        return ['imports', name]
      },
    })
  }
}

component = (node) => {
  indexDefinitions(node)
  indexComponents(node)
  indexModules(node)
  indexInstances(node)
  indexSymbols(node)
  indexImports(node)
  indexAliases(node)
  indexExports(node)
  return node
}

export default component
