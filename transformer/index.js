import { Parser as SexpParser } from './sexp/index.js'
import pipe from './pipe.js'

import {
  parse as parseComponent,
  index as indexComponent,
} from './component/index.js'

const createComponentConfig = (node, ancestors = [node]) => {
  if (node.type !== 'component') {
    throw new Error(
      `expected top level sexp to be component but got ${JSON.stringify(node)}`
    )
  }

  const components = node.components
    .filter(
      ({ type, import: imp, alias }) => type === 'component' && !imp && !alias
    )
    .map((component) => {
      return createComponentConfig(component, [...ancestors, component])
    })

  const modules = node.modules
    .filter(
      ({ type, import: imp, alias }) => type === 'module' && !imp && !alias
    )
    .map(({ source }) => {
      return {
        kind: 'module',
        source,
      }
    })

  const imports = Object.fromEntries(
    node.imports.map(
      ({ type: kind, exports, instanceExpression, import: { name } }) => {
        switch (kind) {
          case 'func':
          case 'table':
          case 'memory':
          case 'global':
            return [
              name,
              {
                kind,
                kindType: [],
              },
            ]
          case 'component':
          case 'module':
            return [
              name,
              {
                kind,
                exports: Object.fromEntries(
                  exports.map(({ name, kindType: { type: kind } }) => [
                    name,
                    { kind },
                  ])
                ),
              },
            ]
          case 'instance':
            return [
              name,
              {
                kind,
                exports: Object.fromEntries(
                  instanceExpression.exports.map(
                    ({ name, kindType: { type: kind } }) => [name, { kind }]
                  )
                ),
              },
            ]
          default:
            throw new Error(`import of type ${kind} not implemented`)
        }
      }
    )
  )

  const instances = node.instances.map(
    ({
      instanceExpression: {
        type,
        arguments: args,
        exports,
        componentPath,
        modulePath,
      },
      import: imp,
      path,
      // eslint-disable-next-line array-callback-return
    }) => {
      switch (type) {
        case 'instantiate component':
          return {
            kind: 'component',
            componentPath: componentPath(ancestors),
            imports: Object.fromEntries(
              args.map(({ name, reference: { kind, path } }) => {
                return [name, { kind, path: path(ancestors) }]
              })
            ),
          }
        case 'instantiate module':
          return {
            kind: 'module',
            modulePath: modulePath(ancestors),
            imports: Object.fromEntries(
              args.map(({ name, reference: { kind, path } }) => {
                return [name, { kind, path: path(ancestors) }]
              })
            ),
          }
        case 'tupling':
          return imp
            ? {
                kind: 'instance',
                path: path(ancestors),
                exports: Object.fromEntries(
                  exports.map(({ name, kindType: { type: kind } }) => {
                    return [name, { kind }]
                  })
                ),
              }
            : {
                kind: 'instance',
                exports: Object.fromEntries(
                  exports.map(({ name, reference: { kind, path } }) => {
                    return [name, { kind, path: path(ancestors) }]
                  })
                ),
              }
      }
    }
  )

  const exports = Object.fromEntries(
    node.exports.map(({ name, kindReference: { kind, path } }) => {
      return [
        name,
        {
          kind,
          path: path(ancestors),
        },
      ]
    })
  )

  return {
    kind: 'component',
    components,
    modules,
    imports,
    instances,
    exports,
  }
}

export default pipe(
  SexpParser({ sourceTags: ['module'] }),
  parseComponent,
  indexComponent,
  createComponentConfig
)
