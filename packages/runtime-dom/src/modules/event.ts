const createInvokers = (callback) => {
  const invoker = (event) => invoker.value(event)
  invoker.value = callback
  return invoker
}

export const patchEvent = (el, eventName, nextValue) => {
  // 缓存事件
  let invokers = el._vei || (el._vei = {})
  // 是否绑定过该事件
  let exitsEvent = invokers[eventName]
  if (exitsEvent && nextValue) {
    exitsEvent.value = nextValue
  } else {
    let event = eventName.slice(2).toLowerCase()
    if (nextValue) {
      const invoker = invokers[eventName] = createInvokers(nextValue)
      el.addEventListener(event, invoker)
    } else if (exitsEvent) {
      el.removeEventListener(event, exitsEvent)
      invokers[eventName] = undefined
    }
  }
}