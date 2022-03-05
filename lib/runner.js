const id = Symbol.for('tappedout_test_runner')
globalThis[id] = globalThis[id] || new Map()
const ref = globalThis[id]
const initialized = ref.get('initialized') || false

class EventEmitter {
  #handlers = {}
  #oncehandlers = {}

  on (event) {
    event = event.trim()
    this.#handlers[event] = this.#handlers[event] || []
    this.#handlers[event].push(...Array.from(arguments).slice(1))
  }

  once (event) {
    event = event.trim()
    this.#oncehandlers[event] = this.#oncehandlers[event] || []
    this.#oncehandlers[event].push(...Array.from(arguments).slice(1))
  }

  emit (event) {
    event = event.trim()
    this.handle(event, this.#handlers)
    this.handle(event, this.#oncehandlers)

    // Clear the onceHandlers after emitting
    this.#oncehandlers[event] = [];
  }

  handle (event, handlers) {
    for (const [name, handlerFns] of Object.entries(handlers)) {
      if (match(name.trim(), event)) {
        for (const handler of handlerFns) {
          handler(...Array.from(arguments).slice(1))
        }
      }
    }
  }
}

function match (pattern, event) {
  if (pattern.indexOf('*') >= 0) {
    pattern = new RegExp(pattern.replace(/\./g, '\.').replace(/\*/g, '(.*)'), 'g')
    return pattern.test(event)
  }

  return pattern === event
}

ref.set('emitter', new EventEmitter())

export {
  ref,
  initialized
}
