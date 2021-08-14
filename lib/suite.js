import { ref } from './runner.js'

// Defined by TAP protocol (testanything.org)
const validDirectives = new Set(['todo', 'skip'])

function safeguard(scope, err, logger) {
  if (!scope) {
    logger.log('not ok Unknown Exception')

    if (err instanceof Error) {
      logger.log(`  ---\n  error: '${err.message}'\n  stack: |\n    ${err.stack.split('\n').map(i => '    ' + i).join('\n').replace(/\r/gi, '').replace(/\n{2,}/g, '\n').trim()}\n  ...`)
    } else if (err) {
      logger.log(`  ---\n  error: '${err.toString()}'\n  ...`)
    }
  }
}

const events = ref.get('emitter')

export default class TestSuite {
  #output

  constructor(name = null, next, abort, start = 0, directive = null, logger) {
    this.#output = logger || console

    if (name !== null) {
      this.comment(name)
    }

    const me = this

    // TODO: Make these private variables/methods when they reach ES Stage 4
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
          if (!me.ended) {
            me.ended = true
            clearTimeout(me.timer)
            next(...arguments)
            events.emit('test.end', me)
          }
        }
      },
      abort: {
        enumerable: false,
        value: function () {
          if (!me.ended) {
            me.ended = true
            clearTimeout(me.timer)
            abort(...arguments)
            events.emit('test.abort', me)
          }
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

    events.emit('suite.create', this)
  }

  get logger () {
    return this.#output || console
  }

  set logger (value) {
    this.#output = value || console
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

  on () {
    return events.on(...arguments)
  }

  emit () {
    return events.emit(...arguments)
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
    safeguard(this, msg, this.logger)

    if (!this.ended && msg.trim().length > 0) {
      this.logger.log(`# ${msg}`)
      this.info(this.detail(...arguments))
    }
  }

  pass (msg = '', directive = null) {
    safeguard(this, msg, this.logger)

    if (!this.ended) {
      this.stats.pass += 1
      this.logger.log(`ok ${this.nextid} ${this.directive(directive)}${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  fail (msg = '', directive = null) {
    if (!(msg instanceof Error)) {
      msg = new Error(msg)
    }

    safeguard(this, msg, this.logger)

    if (!this.ended) {
      if (typeof directive === 'string' && directive.trim().toLowerCase() === 'todo') {
        this.stats.pass += 1
      } else {
        this.stats.fail += 1
      }

      this.logger.log(`not ok ${this.nextid} ${this.directive(directive)}${msg.message}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  skip (msg) {
    safeguard(this, msg, this.logger)

    if (!this.ended) {
      this.stats.skip += 1
      this.logger.log(`ok ${this.nextid} # skip ${msg}`.trim())
      this.info(this.detail(...arguments))
      events.emit('test.skipped', this)
    }
  }

  todo (msg, ok = true) {
    safeguard(this, msg, this.logger)

    if (!this.ended) {
      this.stats.pass += 1
      this.logger.log(`${!ok ? 'not ' : ''}ok # todo ${msg}`.trim())
      this.info(this.detail(...arguments))
    }
  }

  ok (condition, msg, directive = null) {
    safeguard(this, msg, this.logger)

    if (!this.ended) {
      this[condition ? 'pass' : 'fail'](msg, directive)
    }
  }

  failinfo (expected, actual, msg, directive = null) {
    safeguard(this, msg, this.logger)

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
    safeguard(this, data, this.logger)

    // Short-circuit the operation if there is no data at all
    if (!data || this.ended) { return }

    if (typeof data === 'object') {
      if (!data.hasOwnProperty('DISPLAY_OUTPUT') || data.DISPLAY_OUTPUT === true) {
        const msg = Object.keys(data).map(key => `${key}: ${this.format(data[key]).trimStart()}`).map(r => `  ${r}`).join('\n')
        this.logger.log(`  ---\n${msg.replace(/\|\s+\n\s{2}/gi, '|\n    ')}\n  ...`)
      }
      return
    }

    this.logger.log(`  ---\ninfo: ${this.format(data, true)} \n  ...`)
  }

  format (element, newline = false) {
    if (element === null || element === undefined) {
      return ''
    }

    const prefix = newline ? ' |\n' : '  '

    switch (typeof element) {
      case 'object':
        return prefix + JSON.stringify(element, null, 2).split('\n').map(i => `  ${newline ? '  ' : ''}${i}`).join('\n')
      default:
        return prefix + element.toString()
    }
  }

  expect (expected, actual, msg, directive = null) {
    safeguard(this, msg, this.logger)

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
    safeguard(this, msg, this.logger)

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
    safeguard(this, msg, this.logger)

    if (this.ended) {
      return
    }

    try {
      fn()
      this.pass(msg, directive)
    } catch (e) {
      this.fail(msg, directive)
      this.info({
        message: e.message,
        stack: `|${e.stack.replace(/^Error:\s?/, '').split('\n').map(i => '\n    ' + i).join('')}`
      })
    }
  }

  bail (msg = 'unrecognized failure') {
    safeguard(this, msg, this.logger)

    if (!this.ended) {
      this.abort(new Error(msg))
    }
  }

  timeoutAfter (ms) {
    safeguard(this, this.logger)

    if (!this.ended) {
      this.timer = setTimeout(() => this.abort(new Error(`Timed out after ${ms}ms`)), ms)
    }
  }

  end (err) {
    safeguard(this, err, this.logger)

    if (this.ended || !(this instanceof TestSuite)) {
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
