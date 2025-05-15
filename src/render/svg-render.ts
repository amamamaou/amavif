import { h, type VNode } from 'vue'

/** mdiアイコンをsvgのVNodeにする */
export default function svgRender(path: string): VNode {
  return h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { d: path, fill: 'currentcolor' }),
  ])
}
