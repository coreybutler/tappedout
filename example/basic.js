import test from '../index.js'

test('My Test Suite', t => {
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

  t.end()
})
