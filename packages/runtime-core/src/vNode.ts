import { isArray, isObject, isString, ShapeFlags } from "@vue/shared"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export const isSameVNode = (n1, n2) => {
  return n1.type === n2.type && n1.key === n2.key
}

export const createVNode = (type, props, children = null) => {
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT: 0
  const vNode = {
    __v_isVNode: true,
    shapeFlag,
    type,
    props,
    children,
    component: null, // 组件对应的实例
    el: null, // 虚拟节点对应的真实节点
    key: props?.['key'] // 虚拟节点上的key
  }
  if (children) {
    let childrenType = 0
    if (isArray(children)) {
      childrenType = ShapeFlags.ARRAY_CHILDREN
    } else {
      children = String(children)
      childrenType = ShapeFlags.TEXT_CHILDREN
    }
    vNode.shapeFlag |= childrenType
  }
  return vNode
}