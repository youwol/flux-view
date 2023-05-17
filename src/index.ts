// Polyfill for WebKit regarding Customized built-in elements.
// Import's side effect is the installation of the polyfill if needed.
import '@ungap/custom-elements'

export {
    attr$,
    child$,
    Stream$,
    children$,
    AttrOption,
    AttributeType,
    ChildOption,
    ChildrenOption,
} from './lib/stream$'
export {
    ChildrenStream$,
    childrenAppendOnly$,
    childrenWithReplace$,
    childrenFromStore$,
    RenderingUpdate,
    ChildrenUpdateTrait,
    ComparisonTrait,
    OrderingTrait,
    RefElement,
    ChildrenAppendOnlyOption,
    ChildrenFromStoreOption,
    AppendOnlyChildrenStream$,
    FromStoreChildrenStream$,
} from './lib/advanced-children$'
export { render, HTMLElement$ } from './lib/core'
export { VirtualDOM } from './lib/interface'
export { CustomElementsMap } from './lib/factory'
export { setup } from './auto-generated'
