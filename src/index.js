import assign from 'object-assign'

export function caseof (val, handlers) {
  // TODO use for ... of when Symbol.iterator is supported
  for (let i in handlers) {
    let constructors = handlers[i][0]
    let handle = handlers[i][1]
    // Default case
    if (constructors === null) {
      return handle(val)
    }

    if (!Array.isArray(constructors)) {
      constructors = [constructors]
    }

    for (let i in constructors) {
      let ctor = constructors[i]
      if (val instanceof ctor) {
        return handle(val)
      }
    }
  }

  // No handler is matched. This is a type error
  let ctors = handlers.map((handle) => handle[0].name).join(', ')
  throw new TypeError(`Unmatched instance. Must be one of ${ctors}`)
}


export function makeSum (def) {
  let base = () => { throw new TypeError('Cannot call base constructor') }
  for (let name in def) {
    let props = makeAssigner(def[name])
    base[name] = namedConstructor(name, base, props)
  }
  return base
}

function makeAssigner (props) {
  if (typeof props === 'function') {
    return props
  } else {
    return function (...args) {
      let result = {}
      props.forEach((assign, i) => {
        result[assign] = args[i]
      })
      return result
    }
  }
}

/**
 * Create a new contructor function that satisfies the following
 * properties
 *
 *     let C = nameConstructor('C', Base, props)
 *     C() instanceof C
 *     C() instanceof Base
 *     C.name === 'C'
 *     C(...args)[x] === props(...args)[x]
 *
 */
function namedConstructor (name, Base, props) {
  let Ctor = function (...args) {
    let instance = Object.create(Ctor.prototype)
    return assign(instance, props(...args))
  }

  Ctor.prototype = Object.create(Base.prototype)
  Ctor.prototype.constructor = Ctor
  try {
    // Safari throws altough the name property of a function is configurable
    Object.defineProperty(Ctor, 'name', { value: name })
  } catch (error) {}

  return Ctor
}
