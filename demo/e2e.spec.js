import dedent from 'dedent'
import Index from './index.js'
import Examples from './examples.js'

describe('demo', () => {
  describe('examples', () => {
    test.each(Examples())(
      '$name',
      async ({ watSource, jsSource, expectedJsConsole }) => {
        const { transformWat, execJs } = await Index()

        const config = transformWat(watSource)
        const consoleOutput = execJs(jsSource, config)
        expect(consoleOutput.trim()).toBe(expectedJsConsole)
      }
    )
  })

  const scenarios = [
    {
      name: 'chained outer alias',
      watSource: dedent`
        (component $M
          (component $MM
            (component $MMM
              (func $fff (alias $MM $ff))
              (export "inner-inner-exp" (func $fff))
            )
            (func $ff (alias $M $f))
            (instance $ii (instantiate $MMM))
            (func $gg (alias $ii "inner-inner-exp"))
            (export "inner-exp" (func $gg))
            )
          (func $f (import "imp") (result i32))
          (instance $i (instantiate $MM))
          (func $g (alias $i "inner-exp"))
          (export "exp" (func $g))
        )
      `,
      jsSource: dedent`
        const imports = {
          imp() {
            return 42
          }
        }
        const {exports: {exp}} = componentModelPolyfillRuntime(config, imports)
        console.log("exp() ===", exp())
      `,
      expectedJsConsole: dedent`
        exp() === 42
      `,
    },
  ]

  test.each(scenarios)(
    '$name',
    async ({ watSource, jsSource, expectedJsConsole }) => {
      const { transformWat, execJs } = await Index()

      const config = transformWat(watSource)
      const consoleOutput = execJs(jsSource, config)
      expect(consoleOutput.trim()).toBe(expectedJsConsole)
    }
  )
})
