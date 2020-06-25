// Defined by TAP protocol (testanything.org)
const validDirectives = new Set(['todo', 'skip'])

export default class TestSuite {
  constructor (name = null, next, abort, start = 0, directive = null) {
    if (name !== null) {
      this.comment(name)
    }

    const me = this

    Object.defineProperties(this, {
      directiveValue: {
        enumerable: false,
        value: (directive || '').trim().toLowerCase()
      },
      testid: {
        enumerable: false,
        writable: true,
        value: start || 0
      },
      start: {
        enumerable: false,
        writable: true,
        value: start || 0
      },
      stats: {
        enumerable: false,
        value: {
          plan: -1,
          pass: 0,
          fail: 0,
          skip: 0,
          bail: false
        }
      },
      next: {
        enumerable: false,
        value: function () {
          me.ended = true
          clearTimeout(me.timer)
          next(...arguments)
        }
      },
      abort: {
        enumerable: false,
        value: function () {
          me.ended = true
          clearTimeout(me.timer)
          abort(...arguments)
        }
      },
      timer: {
        enumerable: false,
        writable: true,
        value: null
      },
      ended: {
        enumerable: false,
        writable: true,
        value: false
      }
    })
  }

  get nextid () {
    this.testid += 1
    return this.testid
  }

  get total () {
    return this.stats.pass + this.stats.fail
  }

  get planned () {
    return this.stats.plan >= 0 && this.stats.plan !== this.total ? this.stats.plan : this.total
  }

  detail () {
    return typeof arguments[arguments.length - 1] === 'object' ? arguments[arguments.length - 1] : null
  }

  directive (value = null) {
    if (this.directiveValue.length === 0) {
      if (typeof value === 'string') {
        value = value.trim().toLowerCase()
        if (validDirectives.has(value)) {
          return `# ${value} `
        }
      }

      return '- '
    }

    return `# ${this.directiveValue} `
  }

  plan (count = -1) {
    if (!this.ended) {
      this.stats.plan = count
    }
  }

  comment (msg = '') {
    if (!this.ended && msg.trim().length > 0) {
      console.log(`# ${msg}`)
      this.info(this.detail(...arguments))
    }
  }

  pass (msg = '', directive = null) {
    if (!this.ended) {
      this.stats.pass += 1
      console.log(`ok ${this.nextid} ${this.directive(directive)}${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  fail (msg = '', directive = null) {
    if (!this.ended) {
      if (typeof directive === 'string' && directive.trim().toLowerCase() === 'todo') {
        this.stats.pass += 1
      } else {
        this.stats.fail += 1
      }
      console.log(`not ok ${this.nextid} ${this.directive(directive)}${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  skip (msg) {
    if (!this.ended) {
      this.stats.skip += 1
      console.log(`ok ${this.nextid} # skip ${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  todo (msg, ok = true) {
    if (!this.ended) {
      this.stats.pass += 1
      console.log(`${!ok ? 'not ' : ''}ok # todo ${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  ok (condition, msg, directive = null) {
    if (!this.ended) {
      this[condition ? 'pass' : 'fail'](msg, directive)
    }
  }

  failinfo (expected, actual, msg, directive = null) {
    if (!this.ended) {
      this.fail(msg, directive)

      this.info({
        message: 'Unmet expectation',
        severity: 'fail',
        expected,
        actual
      })
    }
  }

  info (data) {
    // Short-circuit the operation if there is no data at all
    if (!data || this.ended) { return }

    if (typeof data === 'object') {
      if (!data.hasOwnProperty('DISPLAY_OUTPUT') || data.DISPLAY_OUTPUT === true) {
        const msg = Object.keys(data).map(key => `${key}: ${this.format(data[key]).trimStart()}`).map(r => `  ${r}`).join('\n')
        console.log(`  ---\n${msg}\n  ...`)
      }
      return
    }

    console.log(`  ---\ninfo: ${this.format(data, true)} \n  ...`)
  }

  format (element, newline = false) {
    if (element === null || element === undefined) {
      return ''
    }

    const prefix = newline ? ' | \n' : '  '

    switch (typeof element) {
      case 'object':
        return prefix + JSON.stringify(element, null, 2).split('\n').map(i => `  ${newline ? '  ' : ''}${i}`).join('\n')
      default:
        return prefix + element.toString()
    }
  }

  expect (expected, actual, msg, directive = null) {
    if (this.ended) {
      return
    }

    if (expected !== actual) {
      this.failinfo(this.format(expected), this.format(actual), msg, directive)
    } else {
      this.pass(msg, directive)
    }
  }

  throws (fn, msg, directive = null) {
    if (this.ended) {
      return
    }

    try {
      fn()
      this.fail(msg, directive)
    } catch (e) {
      this.pass(msg, directive)
    }
  }

  doesNotThrow (fn, msg, directive = null) {
    if (this.ended) {
      return
    }

    try {
      fn()
      this.pass(msg, directive)
    } catch (e) {
      this.fail(msg, directive)
    }
  }

  bail (msg = 'unrecognized failure') {
    if (!this.ended) {
      this.abort(new Error(msg))
    }
  }

  timeoutAfter (ms) {
    if (!this.ended) {
      this.timer = setTimeout(() => this.abort(new Error(`Timed out after ${ms}ms`)), ms)
    }
  }

  end (err) {
    if (this.ended) {
      return
    }

    if (err) {
      if (!(err instanceof Error)) {
        err = new Error(err)
      }

      return this.abort(err)
    }

    if (this.stats.plan >= 0 && this.stats.plan !== this.total) {
      this.bail(`Expected ${this.stats.plan} test${this.stats.plan !== 1 ? 's' : ''}, ${this.total} ran.`)
    } else {
      this.next(this.planned)
    }
  }
}
