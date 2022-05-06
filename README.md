# Component model polyfill

An **incomplete** 🚧 work in progress 🚧 polyfill for [WebAssembly](https://webassembly.org/) [Component model proposal](https://github.com/WebAssembly/component-model).

### 💣 Not production ready 💣

Critical issues need to be resolved before the first release:

- implement [alias syntactic sugar](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md#alias-definitions)
- implement [type definitions](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md#type-definitions)
- implement [function definitions](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md#function-definitions)
- implement [start definitions](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md#start-definitions)
- implement [js api to coerce values](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md#js-api)
- implement type checking
- implement error handling
- add test scenarios
- decide on feature set of first release
  - is binary format support?
- stabilize both runtime and transformer API
- documentation

### Project goals

The intention of this project learn and understand how Componenet model works. We value correctness and clear error messages over performance.
