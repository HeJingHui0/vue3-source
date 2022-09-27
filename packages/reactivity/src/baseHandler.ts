import { reactive } from "./reactive"
import { track, trigger } from "./effect"
import { isObject } from "@vue/shared"

// 枚举 是否是响应式
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers = {
  // receiver 当前的代理对象
  // Reflect 将源对象中的this指向改为代理对象
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    // 依赖收集
    track(target, key)
    const result = Reflect.get(target, key, receiver)
    // 取值嵌套对象时做深度代理
    if (isObject(result)) {
      return reactive(result)
    }
    return result
  },
  set(target, key, value, receiver) {
    const oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      // 值发生变化 派发更新
      trigger(target, key, value, oldValue)
    }
    return result
  }
}