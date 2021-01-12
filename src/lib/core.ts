import { Observable, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { HTMLPlaceHolderElement } from "./html-elements";
import { render, VirtualDOM } from "./vdom";



export class Stream$<T0, T1 = T0> {

    public readonly untilFirst
    public readonly wrapper
    public readonly map
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<T0>,
        { untilFirst, wrapper, map, sideEffects }: 
        { untilFirst?: T1, wrapper?: (T1) => T1, map?: (T0,...args:any[])=>T1 , 
          sideEffects?: (T1, T0) => void } = {}) {

        this.untilFirst = untilFirst
        this.wrapper = wrapper
        this.map = map
        this.sideEffects = sideEffects
    }

    subscribe( fct : (T,...args:any[]) => any, ...withData ) {

        let stream$ = this.map 
            ? this.stream$.pipe( map( (d: any, ...args:any[]) => this.map(d,...withData) ))
            : this.stream$
        
        if( this.untilFirst ){
            let vWrapped = this.wrapper ? this.wrapper(this.untilFirst) : this.untilFirst
            let v1 = fct(vWrapped)
            this.sideEffects && this.sideEffects(vWrapped, v1)
            this.wrapper ? fct(this.wrapper(this.untilFirst)) : fct(this.untilFirst)
        }
        
        return stream$.subscribe( (v:T1) => {
            let vWrapped = this.wrapper ? this.wrapper(v) : v
            let v1 = fct(vWrapped)
            this.sideEffects && this.sideEffects(vWrapped, v1)
        })
    }
}


export function child$<TData>(
    stream$: Observable<TData>,
    vDomMap: (T) => VirtualDOM,
    { untilFirst, wrapper, sideEffects }: 
    { untilFirst?: VirtualDOM, wrapper?: (VirtualDOM) => VirtualDOM, sideEffects?: (TData, HTMLElement) => void  } = {},
      ){

    return new Stream$<VirtualDOM>(
        stream$.pipe(map((data: TData) => vDomMap(data))), 
        {untilFirst, wrapper, sideEffects})
}

export type AttributeType = number | string | boolean | {[key:string]:  number | string | boolean }

export function attr$<TData>(
    stream$: Observable<TData>,
    attrMap: (TData,  ...args: any[]) => AttributeType,
    { untilFirst, wrapper }: { untilFirst?: AttributeType, wrapper?: (AttrType) => AttributeType } = {}){

    return new Stream$<TData, AttributeType>(
        stream$, 
        {untilFirst, wrapper, map: (data: TData, ...args:any[]) => attrMap(data, ...args) })
}


type Constructor<T extends HTMLElement> = new (...args: any[]) => T;


const specialBindings = {
    class: (instance, value) => instance.className = value,
    style: (instance: HTMLElement, value) => {
        Object.entries(value).forEach( ([k,v]) => instance.style[k] = v )
    }
}

export function _$<T extends Constructor<HTMLElement>>(Base: T) {

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
        };

        disconnectedCallback() {
            this.subscriptions.forEach( s => s.unsubscribe())
        }

        private applyAttribute(name: string, value: AttributeType){

            specialBindings[name] 
                ? specialBindings[name](this, value) 
                : this[name] = value
        }
    }
}