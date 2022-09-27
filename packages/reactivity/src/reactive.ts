import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from './baseHandler'

// WeakMap 做缓存 弱引用 不会导致内存泄漏
const reactiveMap = new WeakMap()

export function reactive(target) {
  if (!isObject(target)) {
    return
  }
  // 源对象是代理对象 将执行proxy的get方法并返回次对象 已被代理过的对象不再代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  // 源对象的代理对象是否存在 源对象多次代理返回一个代理对象
  const exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) {
    return exisitingProxy
  }
  const proxy = new Proxy(target, mutableHandlers)
  // 存储映射关系
  reactiveMap.set(target, proxy)
  return proxy
}

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}