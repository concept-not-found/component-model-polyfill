export const coreKindCollection = {
  func: 'funcs',
  table: 'tables',
  memory: 'memories',
  global: 'globals',
}

export default {
  component: 'components',
  instance: 'instances',
  module: 'modules',
  ...coreKindCollection,
}
