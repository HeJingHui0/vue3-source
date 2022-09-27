import { isArray, isObject, isVNode } from "@vue/shared"
import { createVNode } from "./vNode"

export function h(type, propsOrChildren, children) {
  const argsLength = arguments.length
  if (argsLength === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (argsLength > 3) {
      children = Array.from(arguments).slice(2)
    } else if (argsLength === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}