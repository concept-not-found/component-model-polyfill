export default [
  {
    name: 'two instances of a module with independent memory',
    watSource: `(adapter module (;0;)
  (module (;0;)
    (memory 1)
    (func (;0;) (param (;0;) i32)
      (i32.const (;address;) 0)
      (local.get (;param;) 0)
      (i32.store)
    )
    (func (;1;) (result i32)
      (i32.const (;address;) 0)
      (i32.load)
    )
    (export "store" (func 0))
    (export "load" (func 1))
  )
  (instance (;0;) (instantiate (;module;) 0))
  (instance (;1;) (instantiate (;module;) 0))
  (alias (;instance;) 0 "store" (func (;0;)))
  (alias (;instance;) 1 "store" (func (;1;)))
  (export "store instance 0" (func 0))
  (export "store instance 1" (func 1))
  (alias (;instance;) 0 "load" (func (;2;)))
  (alias (;instance;) 1 "load" (func (;3;)))
  (export "load instance 0" (func 2))
  (export "load instance 1" (func 3))
)`,
    jsSource: `const instance = moduleLinkingPolyfillRuntime(config)
console.log("load instance 0:", instance["load instance 0"]())
console.log("load instance 1:", instance["load instance 1"]())

instance["store instance 1"](42)
console.log("store instance 1 = 42")

console.log("load instance 0:", instance["load instance 0"]())
console.log("load instance 1:", instance["load instance 1"]())
`,
  },
  {
    name: 'module shares memory with another',
    watSource: `(adapter module (;0;)
  (module (;0;)
    (memory (;0;) 1)
    (export "mem" (memory 0))
    (func (;0;) (result (;0;) i32)
      (i32.const (;address;) 0)
      (i32.load)
    )
    (export "load" (func 0))
  )
  (module (;1;)
    (import "imp" "mem" (memory 1))
    (func (;0;) (param (;0;) i32)
      (i32.const (;address;) 0)
      (local.get (;param;) 0)
      (i32.store)
    )
    (export "store" (func 0))
  )
  (instance (;0;) (instantiate (;module;) 0))
  (instance (;1;) (instantiate (;module;) 1
    (import "imp" (instance 0))
  ))
  (alias (;instance;) 0 "load" (func (;0;)))
  (alias (;instance;) 1 "store" (func (;1;)))
  (export "load from module 0" (func 0))
  (export "store into module 1" (func 1))
)`,
    jsSource: `const instance = moduleLinkingPolyfillRuntime(config)
console.log("load from module 0:", instance["load from module 0"]())

instance["store into module 1"](42)
console.log("store into module 1 = 42")

console.log("load from module 0:", instance["load from module 0"]())
`,
  },
]
