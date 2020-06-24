const id = Symbol.for('tappedout_test_runner')
globalThis[id] = globalThis[id] || new Map()
const ref = globalThis[id]
const initialized = ref.get('initialized') || false

export {
  ref,
  initialized
}
