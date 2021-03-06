// authored by https://github.com/sudo-suhas
// https://github.com/dmnd/dedent/pull/14
// https://github.com/sudo-suhas/dedent/blob/4b33fe11379e028b675d235ce071186d98f5b2b0/dedent.js

// modified to be esmodule

export function makeDedent() {
  var indent =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ''

  return function dedent(strings) {
    // $FlowFixMe: Flow doesn't undestand .raw
    var raw = typeof strings === 'string' ? [strings] : strings.raw

    // first, perform interpolation
    var result = ''
    for (var i = 0; i < raw.length; i++) {
      result += raw[i]
        // join lines when there is a suppressed newline
        .replace(/\\\n[ \t]*/g, '')
        // handle escaped backticks
        .replace(/\\`/g, '`')

      if (i < (arguments.length <= 1 ? 0 : arguments.length - 1)) {
        result += arguments.length <= i + 1 ? undefined : arguments[i + 1]
      }
    }

    // now strip indentation
    var lines = result.split('\n')
    var mindent = null
    lines.forEach(function (l) {
      var m = l.match(/^(\s+)\S+/)
      if (m) {
        var lineIndent = m[1].length
        if (!mindent) {
          // this is the first indented line
          mindent = lineIndent
        } else {
          mindent = Math.min(mindent, lineIndent)
        }
      }
    })

    if (mindent !== null) {
      ;(function () {
        var m = mindent // appease Flow
        result = lines
          .map(function (l) {
            return indent + (l[0] === ' ' ? l.slice(m) : l)
          })
          .join('\n')
      })()
    }

    return (
      indent +
      result
        // dedent eats leading and trailing whitespace too
        .trim()
        // handle escaped newlines at the end to ensure they don't get stripped too
        .replace(/\\n/g, '\n')
    )
  }
}

// Create the default dedent string tag with no default indent.
var dedent = makeDedent()

export default dedent
