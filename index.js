import { ref, initialized } from './lib/runner.js'
import test from './lib/test.js'
import TestSuite from './lib/suite.js'

if (!initialized) {
  ref.set('initialized', true)
  setTimeout(run, 300)
}

let testid = 0

function runner (fn, name = null, directive = null) {
  const TestRunner = ref.get('runner') || TestSuite

  return new Promise((resolve, reject) => {
    const suite = new TestRunner(name, resolve, reject, testid, directive, ref.get('logger') || console)

    try {
      fn(suite)
    } catch (e) {

      process.stdout.write(e.message)
      suite.fail(e.stack.split('\n')[0].trim(), {
        stack: '| \n  ' + e.stack
      })
      suite.end()
      // reject(new Error(e))
    }
  })
}

async function run () {
  const tests = ref.get('tests') || []
  const logger = ref.get('logger') || console
  const TestRunner = ref.get('runner') || TestSuite
  const before = ref.get('before')
  const after = ref.get('after')
  const beforeEach = ref.get('beforeEach')
  const afterEach = ref.get('afterEach')

  // Identify TAP version
  logger.log('TAP version 13')

  // Short circuit if there are no tests
  if (tests.length === 0) {
    logger.log('Bail out! no tests')
    return
  }

  // Execute pre-suite tests
  if (typeof before === 'function') {
    await runner(before)
  }

  // Run tests sequentially
  for (const test of tests) {
    // Execute pre-tests
    if (typeof beforeEach === 'function') {
      await runner(beforeEach)
    }

    await
      runner(test[1], test[0], test.length === 3 ? test[2] : null)
      .then(count => { testid += count })
      .catch(abort)

    // Execute pre-tests
    if (typeof afterEach === 'function') {
      await runner(afterEach)
    }
  }

  // Execute post-suite tests
  if (typeof after === 'function') {
    await runner(after)
  }

  // Output the final plan on "next tick"
  logger.log(`1..${testid}`)
}

function abort (e) {
  (ref.get('logger') || console).log(`Bail out! ${e.message}`)

  try {
    process.exit(1)
  } catch (e) {
    try {
      Deno.exit(1)
    } catch (e) {
      throw ''
    }
  }
}

export { test as default, test, TestSuite as Runner }
