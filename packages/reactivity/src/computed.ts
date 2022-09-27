import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect"

class ComputedRefImpl {
  public effect
  // 默认取值进行计算 不做缓存
  public _dirty = true
  public __v_isReadonly = true
  public __v_isRef = true
  public _value
  public dep = new Set
  constructor(getter, public setter) {
    // 将computed中的function放入effcet中， 就可以对computed中的属性进行依赖收集
    this.effect = new ReactiveEffect(getter, () => {
      // 依赖的属性改变会执行此scheduler
      if (!this._dirty) {
        this._dirty = true
        // computed派发更新
        triggerEffects(this.dep)
      }
    })
  }
  get value() {
    // computed依赖收集
    trackEffects(this.dep)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}

export const computed = (funcOrOptions) => {
  let getter
  let setter
  let onlyGetter = isFunction(funcOrOptions)
  if (onlyGetter) {
    getter = funcOrOptions
    setter = () => console.warn('no set')
  } else {
    getter = funcOrOptions.get
    setter = funcOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}