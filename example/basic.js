import test from '../index.js'

// test('My Test Suite', t => {
//   t.ok(true, 'I am OK.')
//   t.ok(false, 'I am still OK.') // Expect a failure here!
//   t.end()
// })
console.log(test)
test.only('suite name', t => {
  t.ok(test, 'a-ok')
  t.end()
})
