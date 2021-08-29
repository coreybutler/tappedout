import test from '../index.js'

test.autostart = false
test.onEnd(() => check(true, 'test.onEnd ran'))

// Test harness
let queue = []
const log = console.log
console.log = function () {
  queue.push(...arguments)
}

function check (condition, msg = null) {
  if (msg !== null) {
    process.stdout.write((condition ? '[OK]    ' : '[ERROR] ') + msg + '\n')
  }

  if (!condition) {
    process.exit(1)
  }
}

check(!test.running, 'Runner indicates it is not running when it is not.')

test.before(t => {
  check(test.running === true, 'Runner indicates it is running when it is.')
  t.ok(true, 'before')
  check(queue[1].trim() === 'ok 1 - before', 'Successfully executed before method.')
  queue = [queue[0]]
  t.end()
})

test.after(t => {
  t.ok(true, 'after')
  check(queue[1].trim() === `ok ${t.start + 1} - after`, 'Successfully executed after method.')
  queue = [queue[0]]
  t.end()
})

test.beforeEach(t => {
  check(true, `Pre-test ${t.start + 1} executed`)
  t.end()
})

test.afterEach(t => {
  check(true, `Post-test ${t.start} executed`)
  t.end()
})

// pass
test('pass', t => {
  t.pass('passed')
  check(queue[2] === `ok ${t.start + 1} - passed`, 'Successful test output recognized.')
  queue = [queue[0]]
  t.end()
})

// fail
test('fail', t => {
  t.fail('failed')
  check(queue[2] === `not ok ${t.start + 1} - failed`, 'Unsuccessful test output recognized.')
  queue = [queue[0]]
  t.end()
})

// comment
test('comment', t => {
  t.comment('comment')
  check(queue[2] === '# comment', 'Comment recognized.')
  queue = [queue[0]]
  t.end()
})

// ok
test('ok()', t => {
  t.ok(true, 'yes')
  t.ok(false, 'no')

  check(queue[0] === 'TAP version 13', 'TAP header specified')
  check(queue[1] === '# ok()', 'Test suite comment recognized.')
  check(queue[2] === `ok ${t.start + 1} - yes`, 'Successful test recognized.')
  check(queue[3] === `not ok ${t.start + 2} - no`, 'Unsuccessful test recognized.')

  queue = [queue[0]]

  t.end()
})

test.start()

// test('a', t => {
//   // t.plan(3)
//   t.ok(true, 'basic ok works')
//   t.ok(false, 'basic fail', 'todo')
//   t.comment('here is a comment')
//   t.throws(() => {
//     throw new Error('err')
//   }, 'threw an error')
//   t.doesNotThrow(() => {
//     throw new Error('err')
//   }, 'did not throw an error')
//   t.end()
// })

// test('b', t => {
//   t.ok(true, 'basic ok works')
//   t.ok(false, 'basic fail')

//   t.expect(1, 2, 'Expecting a failure to print.')
//   t.end()
// })
