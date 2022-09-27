import { isFunction, isObject } from "@vue/shared"
import { ReactiveEffect } from "./effect"
import { isReactive } from "./reactive"

function traverse(source, set = new Set()) {
  if (!isObject(source)) return source
  // 解决对象中存在循环引用的问题 避免死递归
  if (set.has(source)) return source
  set.add(source)
  for (let key in source) {
    traverse(source[key], set)
  }
  return source
}

export const watch = (source, callback) => {
  let fn
  let oldValue
  // 执行上次watch中传入的回调
  let cleanUp
  if (isReactive(source)) {
    // 递归遍历source进行属性的依赖收集
    fn = () => traverse(source)
  } else if (isFunction(source)) {
    fn = source
  } else {
    return
  }
  const onCleanUp = (cleanFn) => {
    cleanUp = cleanFn
  }
  const newCallback = () => {
    if (cleanUp) {
      cleanUp()
    }
    const newValue = effect.run()
    callback(newValue, oldValue, onCleanUp)
    oldValue = newValue
  }
  // 在effcet中访问属性就会进行依赖收集
  const effect = new ReactiveEffect(fn, newCallback)
  oldValue = effect.run()
}