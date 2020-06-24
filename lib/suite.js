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
          clearTimeout(me.timer)
          next(...arguments)
        }
      },
      abort: {
        enumerable: false,
        value: function () {
          clearTimeout(me.timer)
          abort(...arguments)
        }
      },
      timer: {
        enumerable: false,
        writable: true,
        value: null
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

  directive (value = null) {
    if (this.directiveValue.length === 0) {
      if (value !== null) {
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
    this.stats.plan = count
  }

  comment (msg = '') {
    if (msg.trim().length > 0) {
      console.log(`# ${msg}`)
    }
  }

  pass (msg = '', directive = null) {
    this.stats.pass += 1
    console.log(`ok ${this.nextid} ${this.directive(directive)}${msg}`.trim())
  }

  fail (msg = '', directive = null) {
    if (directive && directive.trim().toLowerCase() === 'todo') {
      this.stats.pass += 1
    } else {
      this.stats.fail += 1
    }
    console.log(`not ok ${this.nextid} ${this.directive(directive)}${msg}`.trim())
  }

  skip (msg) {
    this.stats.skip += 1
    console.log(`ok ${this.nextid} # skip ${msg}`.trim())
  }

  todo (msg, ok = true) {
    this.stats.pass += 1
    console.log(`${!ok ? 'not ' : ''}ok # todo ${msg}`.trim())
  }

  ok (condition, msg, directive = null) {
    this[condition ? 'pass' : 'fail'](msg, directive)
  }

  failinfo (expected, actual, msg, directive = null) {
    this.fail(msg, directive)

    const detail = [
      'message: Unmet expectation',
      'severity: fail',
      `expected: ${expected}`,
      `actual: ${actual}`
    ]

    console.log(`  ---\n${detail.map(r => `  ${r}`).join('\n')}\n  ...`)
  }

  expect (expected, actual, msg, directive = null) {
    if (expected !== actual) {
      if (typeof expected === 'object') {
        expected = JSON.stringify(expected, null, 2).split('\n').map(r => `  ${r}`).join('\n')
      }
      if (typeof actual === 'object') {
        actual = JSON.stringify(actual, null, 2).split('\n').map(r => `  ${r}`).join('\n')
      }

      this.failinfo(expected, actual, msg, directive)
    } else {
      this.pass(msg, directive)
    }
  }

  throws (fn, msg, directive = null) {
    try {
      fn()
      this.fail(msg, directive)
    } catch (e) {
      this.pass(msg, directive)
    }
  }

  doesNotThrow (fn, msg, directive = null) {
    try {
      fn()
      this.pass(msg, directive)
    } catch (e) {
      this.fail(msg, directive)
    }
  }

  bail (msg = 'unrecognized failure') {
    this.abort(new Error(msg))
  }

  timeoutAfter (ms) {
    this.timer = setTimeout(() => this.abort(new Error(`Timed out after ${ms}ms`)), ms)
  }

  end (err) {
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
