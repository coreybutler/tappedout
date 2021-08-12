import { ref, initialized } from './runner.js'

let tests = ref.get('tests') || []
let limitedTests = false

function extract (name, cb) {
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

test.only = only
test.skip = skip
test.todo = todo
test.logger = console
test.before = function (fn) { ref.set('before', fn) }
test.beforeEach = function (fn) { ref.set('beforeEach', fn) }
test.after = function (fn) { ref.set('after', fn) }
test.afterEach = function (fn) { ref.set('afterEach', fn) }

export { test as default, test }
