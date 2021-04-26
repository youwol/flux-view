import { Subscription } from "rxjs";


declare class ChildrenStream$<T0>{}
declare class  HTMLElement${}


/**
 * This is a virtual representation of a DOM element:
 * -    for a given [[tag]], the interface have the same attributes than the associated regular DOM element.
 * -    if tag is not defined, the VirtualDOM is implicitely a *div*.
 * -    children are defined using the [[children]] attribute 
 * 
 * When the Virtual DOM is rendered, it is transformed into a [[HTMLElement$]] : 
 * a custom HTML element that inherits from HTMLElement.
 * 
 * Here is an instance of static VirtualDOM:
 * 
 * ``` typescript
 * let vDOM = {
 *      tag: 'div', // <- for a div, tag can be omitted
 *      class:'text-center border',
 *      style:{ 'backgound-color':'blue' }
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
 * The difference with a regular DOM is that a virtual DOM can have both attributes and children binded
 *  to a RxJS observables using [[attr$]], [[child$]] and [[children$]]:
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
 *      style:{ 'backgound-color':'blue' }
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
 * >
 * > This may be a point to improve in the future.
 */
 export interface VirtualDOM{

    /**
     * tag of the virtual DOM, e.g. *div*, *span*, *table*, *etc*
     * The list of available tags are presented [[CustomElementsMap | here ]]
     */
    tag?: string

    /**
     * The list of children, either an array of [[VirtualDOM]] or a stream of array of [[VirtualDOM]] 
     * ( see [[children$]] for this last case).
     */
    children?: Array<VirtualDOM> | ChildrenStream$<unknown>

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
    [key:string]: any

}


export interface InterfaceHTMLElement$ extends HTMLElement{

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

    renderChildren( children : Array<VirtualDOM> ) : Array<InterfaceHTMLElement$>
}


