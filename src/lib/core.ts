import { Subscription } from "rxjs";
import { ChildrenStream$ } from "./advanced-children$";
import { CustomElementsMap} from "./factory";
import { InterfaceHTMLElement$, VirtualDOM } from "./interface";
import { AttributeType, Stream$ } from "./stream$";


/**
 * The actual element associated to a [[VirtualDOM]].
 * It implements the *regular* constructor of the target element on top of wich the flux-view logic is added,
 * the added public interface is described [[InterfaceHTMLElement$ | here]].
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
            if(vDom instanceof HTMLElement){
                this.currentElement.replaceWith(vDom)
                this.currentElement = vDom
                return vDom
            }
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
            if(!this.vDom)
                return
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

            if(this.vDom.children && this.vDom.children instanceof ChildrenStream$){
                this.subscriptions.push( this.vDom.children.subscribe(this) )
            }
            this.vDom.connectedCallback && this.vDom.connectedCallback(this as unknown as HTMLElement$)
        };

        disconnectedCallback() {
            this.subscriptions.forEach( s => s.unsubscribe())
            this.vDom && this.vDom.disconnectedCallback && this.vDom.disconnectedCallback(this as unknown as  HTMLElement$)
        }

        renderChildren( children : Array<VirtualDOM | Stream$<unknown> | HTMLElement> ) : Array<InterfaceHTMLElement$>{

            let rendered = []
            children.forEach( (child) => {
    
                if(child instanceof Stream$){
                    let placeHolder = document.createElement('fv-placeholder') as HTMLPlaceHolderElement
                    this.appendChild(placeHolder)
                    this.subscriptions.push( 
                        placeHolder.initialize(child) 
                    )
                    rendered.push(placeHolder)
                } 
                else if(child instanceof HTMLElement){
                    this.appendChild(child)
                }   
                else{  
                    let div = render(child)
                    this.appendChild(div)
                    rendered.push(div)
                }
            })
            return rendered
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
