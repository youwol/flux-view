declare class ChildrenStream$<_T> {}
declare class HTMLElement$ {}

/**
 * A VirtualDOM is an HTMLElement described as a javascript object containing the properties:
 * -    tag: the tag of the element, optional using by default 'div'
 * -    [*] any attributes existing in the associated regular DOM element.
 * -    [*] style: the style of the element, defined as `{[k:string]: string}`
 * -    [*] children: the list of children of the element, either {@link VirtualDOM} of {@link HTMLElement}.
 * -    connectedCallback: callback executed when the associated HTMLElement is included in the DOM.
 * Takes {@link HTMLElement$} as single argument.
 * -    disconnectedCallback: callback executed when the associated HTMLElement is removed from the DOM.
 * Takes {@link HTMLElement$} as single argument.
 *
 * When the Virtual DOM is rendered ({@link render}), it is transformed into a {@link HTMLElement$}.
 *
 * Any of the properties listed above with [*] can be provided as stream instead plain value.
 * See {@link attr$}, {@link child$}, {@link children$}, {@link childrenAppendOnly$}, {@link childrenFromStore$}.
 *
 * @category Concepts
 * @category Entry Points
 *
 */
export interface VirtualDOM {
    /**
     * tag of the virtual DOM, e.g. *div*, *span*, *table*, *etc*
     * The list of available tags are presented in {@link CustomElementsMap}
     */
    tag?: string

    /**
     * The list of children, either an array of {@link VirtualDOM} or a stream of array of {@link VirtualDOM}
     */
    children?: Array<VirtualDOM> | ChildrenStream$<VirtualDOM[]>

    /**
     * This method gets called when the VirtualDOM get inserted as actual DOM
     * in the HTML page (i.e. transformed into {@link HTMLElement$}).
     *
     * This is when the view's observables are actually subscribed.
     * A typical usage is to transfer the ownership of some subscriptions to the virtual DOM such that
     * they get properly unsubscribed when the element is removed from the page:
     *
     * ``` typescript
     * let clicked$ = new rxjs.BehaviorSubject({clicked: false})
     * let vDOM = {
     *      tag: 'div',
     *      connectedCallback: (elem: HTMLElement$) => {
     *          // the ownership of sub0 is given to the VirtualDOM
     *          // => it will be unsubscribed when element is actually removed from the view
     *          elem.ownSubscriptions(clicked$.subscribe( (d) => console.log(d)))
     *      }
     *      children: [
     *          {
     *              tag:'button',
     *              innerText: 'hello flux view',
     *              onclick: () => clicked$.next({clicked: true})
     *          }]
     * }
     * ```
     */
    connectedCallback?: (d: HTMLElement$) => void

    /**
     * This method get called when the actual DOM represented by the VirtualDOM
     * gets removed from the HTML page.
     *
     */
    disconnectedCallback?: (d: HTMLElement$) => void

    /**
     * Placeholder for any but tag and children attributes.
     *
     * @hidden
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Index signature effectively optional
    [key: string]: any
}
