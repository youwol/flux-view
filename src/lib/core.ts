import { Subscription } from "rxjs";
import { CustomElementsMap} from "./factory";
import { AttributeType, Stream$ } from "./stream$";


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
    children?: Array<VirtualDOM> | Stream$<unknown, Array<VirtualDOM>>

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

export interface InterfaceHTMLElement${

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

/**
 * The actual element associated to a [[VirtualDOM]].
 * It implements the *regular* constructor of the target element on top of wich the flux-view logic is added,
 * the added public interface is described [[InterfaceHTMLElements$ | here]].
 * 
 * > 🧐 The implementation is based on [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
 */
export class HTMLElement$ extends _$(HTMLElement){

}


class HTMLPlaceHolderElement extends HTMLElement{

    private currentElement: HTMLElement
    constructor() {
        super();
    }

    initialize( stream$: Stream$<VirtualDOM> ): Subscription {

        this.currentElement = this

        let apply = (vDom:VirtualDOM) => {
            let div = render(vDom)
            this.currentElement.replaceWith(div)
            this.currentElement = div
            return div
        }
        
        return stream$.subscribe( (vDom:VirtualDOM) => { return apply(vDom) })
    }
}



type Constructor<T extends HTMLElement> = new (...args: any[]) => T;


const specialBindings = {
    class: (instance, value) => instance.className = value,
    style: (instance: HTMLElement, value) => {
        Object.entries(value).forEach( ([k,v]) => instance.style[k] = v )
    }
}

function _$<T extends Constructor<HTMLElement>>(Base: T) {

    return class extends Base implements InterfaceHTMLElement$ {

        vDom: VirtualDOM;
        subscriptions = new Array<Subscription>()

        constructor(...args: any[]) {
            super(...args);
        }

        initialize(vDom: VirtualDOM){
            this.vDom = vDom
        }
        connectedCallback() {

            let attributes = Object.entries(this.vDom).filter( ([k,v]) => k != 'children' && !(v instanceof  Stream$))
            let attributes$ = Object.entries(this.vDom).filter( ([k,v]) => k != 'children' && (v instanceof  Stream$))

            attributes.forEach( ([k,v]:[k:string, v:any]) => {
                this.applyAttribute(k,v)
            })
            attributes$.forEach( ([k,attr$]:[k:string, attr$:Stream$<AttributeType>]) => {
                this.subscriptions.push(
                    attr$.subscribe( (v) => this.applyAttribute(k,v) , this ) 
                )
            })
            if(this.vDom.children && Array.isArray(this.vDom.children))
                this.renderChildren(this.vDom.children)

            if(this.vDom.children && this.vDom.children instanceof Stream$){
                this.subscriptions.push(
                    this.vDom.children.subscribe( (children) =>{
                        this.textContent = ''
                        this.renderChildren(children)
                    })
                )
            }
            this.vDom.connectedCallback && this.vDom.connectedCallback(this as unknown as HTMLElement$)
        };

        disconnectedCallback() {
            this.subscriptions.forEach( s => s.unsubscribe())
            this.vDom.disconnectedCallback && this.vDom.disconnectedCallback(this as unknown as  HTMLElement$)
        }

        renderChildren( children : Array<VirtualDOM> ){

            children.forEach( (child) => {
    
                if(child instanceof Stream$){
                    let placeHolder = document.createElement('fv-placeholder') as HTMLPlaceHolderElement
                    this.appendChild(placeHolder)
                    this.subscriptions.push( 
                        placeHolder.initialize(child) 
                    )
                }  
                else{  
                    let div = render(child)
                    this.appendChild(div)
                }
            })
        }

        applyAttribute(name: string, value: AttributeType){

            specialBindings[name] 
                ? specialBindings[name](this, value) 
                : this[name] = value
        }

        ownSubscriptions(...subs: Subscription[]){
            this.subscriptions.push(...subs)
        }
    }
}


function factory(tag: string = 'div'):  HTMLElement${

    if(!CustomElementsMap[tag])
        throw Error(`The element ${tag} is not registered in flux-view's factory`)

    let div = document.createElement(tag,{ is:`fv-${tag}` } ) as any
    return div as  HTMLElement$
}

/**
 * Transform a [[VirtualDOM]] into a real HTMLElement (actually an [[HTMLElement$]]).
 * 
 * @param vDom the virtual DOM
 * @returns the 'real' DOM element
 */
export function render( vDom:VirtualDOM ) :  HTMLElement$ {

    let element = factory(vDom.tag)
    element.initialize(vDom)
    return element
}


function registerElement( tag: string, BaseClass ){

    class ExtendedClass$ extends _$(BaseClass){
        constructor() {super();}
    }
    customElements.define( `fv-${tag}`, ExtendedClass$ as any, { extends: tag })    
}

function register() {
    
    customElements.define('fv-placeholder', HTMLPlaceHolderElement);
    
    Object.entries(CustomElementsMap).forEach( ([tag, HTMLElementClass]) => {
       registerElement(tag, HTMLElementClass)
    }) 
}

register()
