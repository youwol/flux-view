import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { VirtualDOM } from "./interface"

/**
 * A RxJs observable that represents a DOM's attribute, child or children.
 * 
 * @param TDomain the domain data type
 * @param TDom the DOM data type: either :
 *     - [[AttributeType]] for attributes (see [[attr$]])
 *     - [[VirtualDOM]] for child (see [[child$]])
 *     - Array<[[VirtualDOM]]> for children (see [[children$]])
 */
export class Stream$<TDomain, TDom = TDomain> {

    public readonly untilFirst
    public readonly wrapper
    public readonly sideEffects

    /**
    * @param stream$  domain's data stream defined as a RxJS observable
    * @param vDomMap function that convert the domain's data to a vDOM attribute
    * @param untilFirst is the data that will be used until the first emitted element in *stream$* is obtained.
    *  If not provided, the attribute/child does not exist until first emission.
    * @param wrapper is a function that is used to alter the data returned by *vDomMap*. 
    * @param sideEffects is a function that provides a handle to execute side effects once the
    * attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function.
     */
    constructor(
        public readonly stream$: Observable<TDomain>,
        public readonly map:  (TDomain,...args:any[])=>TDom,
        { untilFirst, wrapper, sideEffects }: 
        { untilFirst?: TDom, wrapper?: (TDom) => TDom , 
          sideEffects?: (TDom, TDomain) => void } ) {

        this.untilFirst = untilFirst
        this.wrapper = wrapper
        this.sideEffects = sideEffects
    }

    /**
     * Implementation function that supposed to be called only by [[HTMLElement$]].
     */
    subscribe( fct : (T,...args:any[]) => any, ...withData ) {

        let stream$ = this.stream$.pipe( map( (d: any, ...args:any[]) => this.map(d,...withData) ))
        
        this.untilFirst && this.finalize(fct,  this.untilFirst )
        
        return stream$.subscribe( (v:TDom) => {
            this.finalize(fct, v )
        })
    }
    
    private finalize(fct : (T,...args:any[]) => any, value: TDom){
        let vWrapped = this.wrapper ? this.wrapper(value) : value
        let v1 = fct(vWrapped)
        this.sideEffects && this.sideEffects(vWrapped, v1)
    }
}

/**
 * Create a stream of DOM understable element (attribute, child or children) from a RxJS observable.
 * It is most of the times called indirectly using [[attr$]], [[child$]] or [[children$]].
 * 
 * @param stream$  domain's data stream defined as a RxJS observable
 * @param vDomMap function that convert the domain's data to a vDOM attribute: 
 * -    in the case of the function [[attr$]], *TDom* is [[AttributeType]].
 * -    in the case of the function [[child$]], *TDom* is [[VirtualDOM]]. 
 * -    in the case of the function [[children$]], *TDom* is Array<[[VirtualDOM]]>. 
 * @param untilFirst is the data that will be used until the first emitted element in *stream$* is obtained.
 *  If not provided, the attribute/child does not exist until first emission.
 *  In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predifined value) is an alternative that can also be used.
 * @param wrapper is a function that is used to alter the data returned by *vDomMap*. 
 * It is often used to factorize part of the viewMap function that are 'constant' with respect to the data in $stream$*
 * @param sideEffects is a function that provides a handle to execute side effects once the
 * attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function. 
 * For instance, a use case would be to focus an input after being dynamically added to the DOM.
 * @returns a stream usable in [[VirtualDOM]]
 */
export function stream$<TDomain=unknown,TDom = AttributeType | VirtualDOM | Array<VirtualDOM>>(
    stream$: Observable<TDomain>,
    vDomMap: (TDomain, ...args: any[]) => TDom,
    { untilFirst, wrapper, sideEffects }: 
    { untilFirst?: TDom, wrapper?: (TDom) => TDom, sideEffects?: (TDomain, HTMLElement) => void  } = {},
      ){

    return new Stream$<TDomain, TDom>(
        stream$, 
        (data: TDomain, ...args:any[]) => vDomMap(data, ...args),
        {untilFirst, wrapper, sideEffects })
}

/**
 * Type alias for attributes in [[VirtualDOM]]
 */
export type AttributeType = number | string | boolean | {[key:string]:  number | string | boolean }

/**
 * Type specialization of [[stream$]] for TDom = [[VirtualDOM]]
 * 
 * ``` typescript
 * let domain$ : Observable<{name:string}>
 * 
 * let vDOM = {
 *      tag: 'div', 
 *      children:[ 
 *          child$( 
 *              domain$,
 *              ({name}) => ({innerText: 'Hello '+ name}),
 *              {   sideEffects: (vDom, htmlElem) => console.log(vDom, htmlElem),
 *                  untilFirst: ({innerText: 'No name available yet'})
 *              }
 *          )
 *     )
 * }
 * ```
 */
export let child$ = stream$

/**
 * Type specialization of [[stream$]] for TDom = [[AttributeType]]
 * 
 * ``` typescript
 * let domain$ : Observable<{name:string}>
 * 
 * let vDOM = {
 *      tag: 'div', 
 *      innerText: attr$( 
 *          domain$,
 *          ({name}) => name,
 *          {   wrapper: (name) => 'Hello '+ name,
 *              sideEffects: (vDom, htmlElem) => console.log(vDom, htmlElem),
 *              untilFirst: 'No name available yet'
 *          }
 *      )
 * }
 * ```
 */
export let attr$ = stream$
