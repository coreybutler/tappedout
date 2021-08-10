import test from '../index.js'

// test.logger = {
//   log () {
//     console.log('MY LOG:', ...arguments)
//   }
// }

test('My Test Suite', t => {
  t.timeoutAfter(1000) // change this to 100 to see the timeout in action
  t.ok(true, 'I am OK.')
  t.ok(false, 'I am still OK.') // Expect a failure here!

  t.throws(() => {
    throw new Error('Bad process')
  }, 'I threw an error.')

  t.doesNotThrow(() => {
    throw new Error('Bad process')
  }, 'I should not throw an error (but I probably did).')

  t.skip('Irrelevant')
  t.todo('Not implemented yet.')

  setTimeout(() => {
    t.ok(true, 'Delayed method worked.')
    t.end()
  }, 300)
})

test('My Other Test Suite', t => {
  t.timeoutAfter(1000) // change this to 100 to see the timeout in action
  t.ok(true, 'I am OK.')
  t.ok(false, 'I am still OK.') // Expect a failure here!

  t.throws(() => {
    throw new Error('Bad process')
  }, 'I threw an error.')

  t.doesNotThrow(() => {
    throw new Error('Bad process')
  }, 'I should not throw an error (but I probably did).')

  t.skip('Irrelevant')
  t.todo('Not implemented yet.')

  setTimeout(() => {
    t.ok(true, 'Delayed method worked.')
    t.end()
  }, 300)
})
