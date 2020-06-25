import { ref, initialized } from './lib/runner.js'
import test from './lib/test.js'
import TestSuite from './lib/suite.js'

if (!initialized) {
  ref.set('initialized', true)
  setTimeout(run, 0)
}

let testid = 0

async function run () {
  const tests = ref.get('tests') || []

  // Identify TAP version
  console.log('TAP version 13')

  // Run tests sequentially
  for (const test of tests) {
    await new Promise((resolve, reject) => {
      const suite = new TestSuite(test[0], resolve, reject, testid, test.length === 3 ? test[2] : null)
      try {
        test[1](suite)
      } catch (e) {
        suite.fail(e.name, {
          stack: '| \n  ' + e.stack
        })
        suite.end()
        // reject(new Error(e))
      }
    }).then(count => { testid += count })
      .catch(e => {
        console.log(`Bail out! ${e.message}`)
        process.exit(1)
      })
  }

  // Output the final plan on "next tick"
  setTimeout(() => console.log(`1..${testid}`), 0)
}

export { test as default, test }
