import { ref, initialized } from './runner.js'

let tests = ref.get('tests') || []
let limitedTests = false

function extract (name, cb) {
  ref.set('autostart', test.autostart)
  ref.set('logger', test.logger)
  ref.set('runner', test.runner)

  if (typeof name === 'function') {
    cb = name
    name = null
  }

  return { name, cb }
}

function test () {
  if (!limitedTests) {
    const { name, cb } = extract(...arguments)
    tests.push([name, cb])
    ref.set('tests', tests)
  }
}

function only () {
  if (!limitedTests) {
    tests = []
    limitedTests = true
  }

  const { name, cb } = extract(...arguments)
  tests.push([name, cb])
  ref.set('tests', tests)
}

function skip () {
  if (!limitedTests) {
    const { name, cb } = extract(...arguments)
    tests.push([name, cb, 'skip'])
    ref.set('tests', tests)
  }
}

function todo () {
  if (!limitedTests) {
    const { name, cb } = extract(...arguments)
    tests.push([name, cb, 'todo'])
    ref.set('tests', tests)
  }
}

function clear (reset = false) {
  tests = []
  ref.set('tests', [])
  ref.set('testid', reset ? 0 : ref.get('testid') || 0)
}

test.only = only
test.skip = skip
test.todo = todo
test.clear = clear
test.logger = console
test.autostart = true
test.onEnd = fn => ref.get('emitter').once('end', fn)
test.on = function () { ref.get('emitter').on(...arguments) }
test.once = function () { ref.get('emitter').once(...arguments) }
test.start = () => ref.get('start')()
test.before = function (fn) { ref.set('before', fn) }
test.beforeEach = function (fn) { ref.set('beforeEach', fn) }
test.after = function (fn) { ref.set('after', fn) }
test.afterEach = function (fn) { ref.set('afterEach', fn) }

Object.defineProperty(test, 'running', {
  enumerable: true,
  get () {
    return ref.get('running')
  }
})

export { test as default, test }
