import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
export * from "@vue/runtime-core"

const renderOptions = Object.assign(nodeOps, {patchProp})

export const render = (vNode, container) => {
  createRenderer(renderOptions).render(vNode, container)
}