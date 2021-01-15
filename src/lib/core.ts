import { Subscription } from "rxjs";
import { CustomElementsMap} from "./factory";
import { AttributeType, Stream$ } from "./stream$";



export interface VirtualDOM{

    tag?: string
    [key:string]: any
    connectedCallback?: (d) => void
    disconnectedCallback?: (d) => void
}


class HTMLElement$ extends _$(HTMLElement){
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

    return class extends Base {

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

            this.vDom.children && this.vDom.children.forEach( (child) => {
    
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
            this.vDom.connectedCallback && this.vDom.connectedCallback(this)
        };

        disconnectedCallback() {
            this.subscriptions.forEach( s => s.unsubscribe())
            this.vDom.disconnectedCallback && this.vDom.disconnectedCallback(this)
        }

        private applyAttribute(name: string, value: AttributeType){

            specialBindings[name] 
                ? specialBindings[name](this, value) 
                : this[name] = value
        }
    }
}


function factory(tag: string = 'div'):  HTMLElement${

    if(!CustomElementsMap[tag])
        throw Error(`The element ${tag} is not registered in flux-view's factory`)

    let div = document.createElement(tag,{ is:`fv-${tag}` } ) as any
    return div as  HTMLElement$
}


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
