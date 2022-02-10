/*
 * Public API Surface of flux-lib-core
 */

export { attr$, child$, Stream$, children$ } from './lib/stream$'
export {
    childrenAppendOnly$,
    childrenWithReplace$,
    RenderingUpdate,
} from './lib/advanced-children$'
export { render, HTMLElement$ } from './lib/core'
export { VirtualDOM } from './lib/interface'
