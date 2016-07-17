import assign from 'object-assign'

export function caseof (val, handlers) {
  for (let [constructors, handle] of handlers) {
    // Default case
    if (constructors === null) {
      return handle(val)
    }

    if (!Array.isArray(constructors)) {
      constructors = [constructors]
    }

    for (let ctor of constructors) {
      if (val instanceof ctor) {
        return handle(val)
      }
    }
  }

  // No handler is matched. This is a type error
  let ctors = handlers.map(([ctor]) => ctor.name).join(', ')
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
  Object.defineProperty(Ctor, 'name', { value: name })

  return Ctor
}
