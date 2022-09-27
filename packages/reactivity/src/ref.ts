import { isArray, isObject } from "@vue/shared"
import { trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"

class RefImpl {
  public _value
  public __v_isRef = true
  public dep = new Set
  constructor(public rawValue){
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep)
    return this._value
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}

class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key]
  }
  set Value(newValue) {
    this.object[this.key] = newValue
  }
}

const toReactive = (value) => {
  return isObject(value) ? reactive(value) : value
}

export const ref = (value) => {
  return new RefImpl(value)
}

export const toRef = (object, key) => {
  return new ObjectRefImpl(object, key)
}

export const toRefs = (object) => {
  const result = isArray(object) ? new Array(object.length) : {}
  for(let key in object) {
    result[key] = toRef(object, key)
  }
  return result
}

export const proxyRefs = (object) => {
  return new Proxy(object, {
    get(target, key, recevier) {
      const result = Reflect.get(target, key, recevier)
      return result.__v_isRef ? result.value : result
    },
    set(target, key, newValue, recevier) {
      const oldValue = target[key]
      if (oldValue.__v_isRef) {
        oldValue.value = newValue
        return true
      } else {
        return Reflect.set(target, key, newValue, recevier)
      }
    }
  })
}