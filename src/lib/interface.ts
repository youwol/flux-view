import { Subscription } from 'rxjs'

declare class ChildrenStream$<_T> {}
declare class HTMLElement$ {}

/**
 * Interface for internal representation of DOM nodes:
 * -    for a given [[tag]], the interface have the same attributes as the associated regular DOM element.
 * -    if tag is not defined, the VirtualDOM is implicitly a *div*.
 * -    children are defined using the [[children]] attribute
 * -    the attribute **style** can be used to set some styles (provide as a Map<string, string)>)
 *
 * When the Virtual DOM is rendered, it is transformed into a [[HTMLElement$]] :
 * a [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
 *  that inherits from HTMLElement.
 *
 * Here is an instance of static VirtualDOM:
 *
 * ``` typescript
 * let vDOM = {
 *      tag: 'div', // <- for a div, tag can be omitted
 *      class:'text-center border',
 *      style:{ 'background-color':'blue' }
 *      id:'my-div',
 *      onclick: () => console.log('on-click'),
 *      children: [
 *          {
 *              tag:'button',
 *              innerText: 'click me'
 *          }]
 * }
 * ```
 *
 * ## Connection to observables
 *
 * The difference with a regular DOM is that a virtual DOM can have both attributes and children bound
 * to a RxJS observables using [[attr$]], [[child$]] and [[children$]]:
 *
 *``` typescript
 * // clicked$ is somehow our state (similar to a redux pattern)
 * let clicked$ = new rxjs.BehaviorSubject({clicked: false})
 *
 * let vDOM = {
 *      tag: 'div',
 *      class: attr$(
 *          clicked$,
 *          ({clicked}) => clicked ? 'text-secondary': 'text-primary',
 *          {wrapper: (classes) => classes + ' text-center border'
 *      ),
 *      style:{ 'background-color':'blue' }
 *      id:'my-div',
 *      onclick: () => console.log('on-click'),
 *      children: [
 *          {
 *              tag:'button',
 *              innerText: 'click me',
 *              onclick: () => clicked$.next({clicked: true})
 *          },
 *          child$(
 *              clicked$,
 *              ({clicked}) => ({ tag: 'span', innerText: 'clicked!!' }),
 *              {untilFirst: { tag: 'span', innerText: 'not clicked yet' }
 *          )
 *      ]
 * }
 * ```
 *
 * > Beside the [[tag]] attribute, there is no declaration of others attribute:
 * > the attribute you provide may have no effect if they do not exist for the
 * > attribute tag you have provided 😒.
 *
 * ## **connectedCallback** and **disconnectedCallback**
 *
 * -    the method **connectedCallback** allows to provide a function that will be executed when
 * the element is actually added to the document. It takes as argument the corresponding HTMLElement.
 * -    the method **disconnectedCallback** allows to provide a function that will be executed when
 * the element is removed from the document. It takes as argument the corresponding HTMLElement.
 *
 * A common use of  **connectedCallback** is to provide the ownership of a
 * (RxJs Subscription)[https://rxjs-dev.firebaseapp.com/guide/subscription] to the displayed element:
 * whenever the element will be added/removed from the document, the subscription will be started/unsubscribed.
 *
 * ```typescript
 * import { BehaviorSubject } from 'rxjs';
 * import { render } from '@youwol/flux-view'
 *
 * let option$ = new BehaviorSubject<string>('option0')
 *
 * let vDom = {
 *   class:'d-flex justify-content-center',
 *   children:[
 *       {
 *           tag:'select',
 *           children:[
 *               {tag:'option', innerText:'option 1'},
 *               {tag:'option', innerText:'option 2'},
 *           ],
 *           onchange: (ev) => option$.next( ev.target.value)
 *       }
 *   ],
 *   connectedCallback: (elem: HTMLElement$) => {
 *      let sub = option$.subscribe( option => {...})
 *       //This makes the subscription managed by the DOM
 *       elem.ownSubscriptions(sub)
 *   }
 * }
 *let div = render(vDOom)
 *```
 *
 */
export interface VirtualDOM {
    /**
     * tag of the virtual DOM, e.g. *div*, *span*, *table*, *etc*
     * The list of available tags are presented [[CustomElementsMap | here ]]
     */
    tag?: string

    /**
     * The list of children, either an array of [[VirtualDOM]] or a stream of array of [[VirtualDOM]]
     * ( see [[children$]] for this last case).
     */
    children?: Array<VirtualDOM> | ChildrenStream$<VirtualDOM[]>

    /**
     * This method gets called when the VirtualDOM get inserted as actual DOM
     * in the HTML page (i.e. transformed into ).
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
     * @Hidden
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Index signature effectively optional
    [key: string]: any
}

/**
 * This interface declares the methods added to [[HTMLElement$]]
 * w/ regular HTMLElement.
 *
 */
export interface InterfaceHTMLElement$ extends HTMLElement {
    /**
     * The provided subscription get owned by the element:
     * it will be unsubscribed when the element is removed from the DOM.
     *
     * Typically:
     *  * ``` typescript
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
     * @param sub subscription
     */
    ownSubscriptions(...sub: Subscription[])
}
