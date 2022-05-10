import { coreKindCollection } from '../kind-collection.js'

function resolveIndex(node, kind, kindIdx) {
  const collection = coreKindCollection[kind]
  return typeof kindIdx === 'number'
    ? kindIdx
    : node.symbolIndex[collection][kindIdx]
}

function directPath(node, kind, kindIdx) {
  const collection = coreKindCollection[kind]
  return [collection, resolveIndex(node, kind, kindIdx)]
}

const indexExports = (node) => {
  for (const exp of node.exports) {
    Object.defineProperty(exp, 'path', {
      value() {
        const {
          kindReference: { kind, kindIdx },
        } = exp
        return directPath(node, kind, kindIdx)
      },
    })
  }
}

const indexDefinitions = (node) => {
  const matchers = [
    ...Object.entries({ ...coreKindCollection, export: 'exports' }).map(
      ([kind, collection]) => [collection, ({ type }) => type === kind]
    ),
    ['imports', ({ import: imp }) => imp],
  ]
  for (const [collection, matcher] of matchers) {
    node[collection] = node.definitions.filter(matcher)
  }
  delete node.definitions
}

const indexSymbols = (node) => {
  node.symbolIndex = {}
  for (const collection of Object.values(coreKindCollection)) {
    node.symbolIndex[collection] = {}

    for (const [kindIdx, { name }] of node[collection].entries()) {
      if (name) {
        node.symbolIndex[collection][name] = kindIdx
      }
    }
  }
}

export default (node) => {
  indexDefinitions(node)
  indexSymbols(node)
  indexExports(node)
  return node
}
