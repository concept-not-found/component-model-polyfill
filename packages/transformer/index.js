import watParser from './parser/index.js'
import indexAdapterModule from './index-adapter-module/index.js'
import pipe from './pipe.js'

const createAdapterModuleConfig = (node, ancestors = [node]) => {
  const [adapterValue, moduleValue] = node
  if (adapterValue !== 'adapter' || moduleValue !== 'module') {
    throw new Error(
      `expected top level sexp to be adapter module but got ${JSON.stringify(
        node
      )}`
    )
  }

  const modules = node.meta.modules
    .filter((module) => module.meta.type === 'core' || !module.meta.import)
    .map((module) => {
      const {
        meta: { type, source },
      } = module
      if (type === 'core') {
        return {
          kind: 'module',
          source,
        }
      }
      return createAdapterModuleConfig(module, [...ancestors, module])
    })

  const imports = Object.fromEntries(
    node.meta.imports.map(
      ({ meta: { moduleName, kind, kindType, exports } }) => {
        switch (kind) {
          case 'func':
          case 'table':
          case 'memory':
          case 'global':
            return [
              moduleName,
              {
                kind,
                kindType,
              },
            ]
          case 'module':
          case 'instance':
            return [
              moduleName,
              {
                kind,
                exports: Object.fromEntries(
                  exports.map(({ meta: { name, kind } }) => [name, { kind }])
                ),
              },
            ]
          default:
            throw new Error(`import of type ${kind} not implemented`)
        }
      }
    )
  )

  const instances = node.meta.instances.map((instance) => {
    const {
      meta: { instantiate, imports, exports, modulePath, path },
    } = instance
    if (instantiate) {
      return {
        kind: 'module',
        modulePath: modulePath(ancestors),
        imports: Object.fromEntries(
          imports.map((imp) => {
            const { name, kind } = imp.meta
            return [name, { kind, path: imp.meta.path(ancestors) }]
          })
        ),
      }
      // eslint-disable-next-line unicorn/consistent-destructuring
    } else if (instance.meta.import) {
      return {
        kind: 'instance',
        path: path(ancestors),
        exports: Object.fromEntries(
          exports.map((exp) => {
            const {
              meta: { name, kind },
            } = exp
            return [name, { kind }]
          })
        ),
      }
    } else {
      return {
        kind: 'instance',
        exports: Object.fromEntries(
          exports.map((exp) => {
            const {
              meta: { name, kind, path },
            } = exp
            return [name, { kind, path: path(ancestors) }]
          })
        ),
      }
    }
  })

  const exports = Object.fromEntries(
    node.meta.exports.map((exp) => {
      const {
        meta: { name, kind, path },
      } = exp
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
    kind: 'adapter module',
    modules,
    imports,
    instances,
    exports,
  }
}

export default pipe(
  watParser({ sourceTags: ['module'] }),
  (root) => {
    if (root.length !== 1) {
      throw new Error('expected a single adapter module')
    }
    const [node] = root
    indexAdapterModule(node)
    return node
  },
  createAdapterModuleConfig
)
