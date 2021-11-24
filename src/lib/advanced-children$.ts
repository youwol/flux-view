/**
 * # Introduction
 * 
 * When working with domain data that generates an array of [[VirtualDOM]] 
 * the function [[children$]] has already been presented.
 * 
 * However, as explained in its documentation, it is not the most efficient 
 * solution as each time the source observable emit new data the DOM children
 * are flushed and re-created from scratch. 
 * 
 * If performance becomes an issue, the functions provided here add extra pieces 
 * of logic to avoid flushing all the children and re-rendering them all each time a new elements are emitted.
 * 
 * The library provides 2 policies for such case:
 * -   [[AppendOnlyChildrenStream$]]: when a new array of domains data is emitted, 
 * corresponding DOM elements are always appended as children, no replacements, no deletions.
 * -   [[ReplaceChildrenStream$]]: when a new array of domains data is emitted, only new elements
 * are created, previous elements that are not part of the new array are removed. Element comparison
 * is by default references comparison (valid if domain data are immutables), but a custom function can provided. 
 * 
 * @module advancedChildren$
 */

import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { render } from "./core";
import { InterfaceHTMLElement$, VirtualDOM } from "./interface";

/**
 * ## RefElement
 * 
 * RefElement references the three component of a view (related 
 * to the function [[advancedChildren$]] when *sideEffects* is called):
 * -    domainData: the domain data
 * -    virtualDom: the virtual dom as defined by the developer
 * -    element: the actual [[HTMLElement$]]
 */
export class RefElement<TDomain>{
    /**
     * domainData
     */
     public readonly domainData: TDomain
    /**
     * the virtual DOM as defined by the developer
     */
     public readonly virtualDOM: VirtualDOM
    /**
     * the actual DOM element
     */
     public readonly element: InterfaceHTMLElement$

    constructor({domainData, virtualDOM, element}) {
        this.domainData = domainData
        this.virtualDOM = virtualDOM
        this.element = element
    }
}


/**
 * ## RenderingUpdate
 * 
 * This class describes an update when DOM has been modified through the use 
 * of [[advancedChildren$]]; it provides the list of **added**, **updated**, and **removed**
 * [[RefElement]].
 * 
 */
export class RenderingUpdate<TDomain>{

    constructor( 
        public readonly added:RefElement<TDomain>[],
        public readonly updated:RefElement<TDomain>[],
        public readonly removed:RefElement<TDomain>[]
        ){}
}



/**
 * ## ChildrenStream$
 * 
 * Base class used to define advanced **children** policy in [[VirtualDOM]] when
 * the source stream emit **array** of domain data.
 * 
 * You can derive you own class by providing the implementation of [[update]].
 * 
 * Example of use: [[AppendOnlyPolicy]], [[ReplacePolicy]].
 */
export abstract class ChildrenStream$<TDomain> {

    ClassType = "ChildrenStream$"
    /**
     * Callback that gets called when the DOM has been updated.
     * @param parent parent: parent [[HTMLElement$]]
     * @param update update: description of the update, see [[RenderingUpdate]]
     */
    public readonly sideEffects : ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void

    /**
     * If orderingIndex is supplied, all children elements are sorted according to the index
     */
     public readonly orderingIndex : ( data: TDomain ) => number

    /**
     * 
     * @param stream$ input stream 
     * @param map mapping function domain data => [[VirtualDOM]]
     * @param sideEffects see [[sideEffects]] 
     * @param orderingFunction see [[orderingFunction]] 
     */
    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM ,
        { 
            sideEffects,
            orderingIndex
        }: 
        { 
            sideEffects?: ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void,
            orderingIndex? : ( data:TDomain) => number
        }) {
        this.map = map
        this.sideEffects = sideEffects
        this.orderingIndex = orderingIndex
    }

    protected abstract update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>) : RenderingUpdate<TDomain>

    /**
     * Only for internal use (within [[HTMLElement$]]), should not actually be exposed.
     */
    subscribe( parentElement: InterfaceHTMLElement$ ) {
        
        return this.stream$.pipe( 
            map( (domains: any) => {                
                return this.update(parentElement, domains)
            })
        ).subscribe(
            (updates) => this.sideEffects && this.sideEffects(parentElement, updates)
        )
    }
}

export function instanceOfChildrenStream$(obj: any): obj is ChildrenStream$<any> {
    return obj && (obj as ChildrenStream$<any>).ClassType === "ChildrenStream$"
}

/**
 * 
 * ## AppendOnlyChildrenStream$
 * 
 * Use case: when the emitting source of the array of domain data is always emitting new data
 * for which associated DOM nodes need to be added.
 * 
 * In practice it is often used through the companion function [[childrenAppendOnly$]]
 *  
 * For instance:
 *  
*```typescript
* class DomainData{ 
*    constructor( public readonly value: string){}
*}
*let hello = new DomainData("hello")
*let world = new DomainData("world")
*let foo = new DomainData("foo")
*let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
*let vDOM = { 
*    children: appendOnlyChildren$(
*        stream$,
*        (data: DomainData) => ({innerText: data.value})
*    )
*}
* body.appendChild(render(vDOM))
* //<div> 
* //    <div> hello </div> 
* //    <div> world </div> 
* //</div>
* stream$.next([hello, foo])
* //<div> 
* //    <div> hello </div> 
* //    <div> foo </div> 
* //    <div> hello </div> 
* //    <div> foo </div> 
* //</div>
*``` 
* 
*/
export class AppendOnlyChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

    public readonly untilFirst
    public readonly sideEffects

    private indexingOrders = new Map<HTMLElement, number>()

    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM,
        options: any
        ) {
        super(stream$, map, options)
    }

    protected update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>
        ) : RenderingUpdate<TDomain> {

        let vDOMs = domainData.map( domain => this.map(domain))
        let rendered = vDOMs.map( vDOM => render(vDOM))

        if(!this.orderingIndex)
            rendered.forEach( div => parentElement.appendChild(div))
        
        if(this.orderingIndex){
            rendered.forEach( (elem, i) =>  this.setIndex(elem, this.orderingIndex(domainData[i])) )
            let existingElements = Array.from(parentElement.children) as HTMLElement[]
            rendered.forEach( newElement => {
                let next = existingElements.find( existingElement => this.getIndex(existingElement) > this.getIndex(newElement))
                next 
                    ? parentElement.insertBefore(newElement, next)
                    : parentElement.appendChild(newElement)
                existingElements = Array.from(parentElement.children) as HTMLElement[]
            })
        }
        let added = domainData.map( (d,i) => 
            new RefElement<TDomain>({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}) 
        )

        return new RenderingUpdate(added, [], [])
    }

    private getIndex(elem: HTMLElement) : number {
        return this.indexingOrders.get(elem)
    }
    private setIndex(elem: HTMLElement, index: number) {
        return this.indexingOrders.set(elem, index)
    }
}


/**
 * 
 * ## childrenAppendOnly$
 * 
 * Creation function companion of [[AppendOnlyChildrenStream$]].
 * 
 * 
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between DomainData and [[VirtualDOM]]
 * @param policy The policy for children management, e.g. [[AppendOnlyPolicy]], [[ReplacePolicy]]
 * @param sideEffects Callback called after modification of the view, provided arguments are:
 * -    parent: [[HTMLElement$]] parent element
 * -    update: description of the update using [[RenderingUpdate]]
 * @returns 
 * @template TDomain Domain data type
 */
export function childrenAppendOnly$<TDomain=unknown>(

    stream$: Observable<Array<TDomain>>,
    vDomMap: (TDomain, ...args: any[]) => VirtualDOM,
    {   
        sideEffects,
        orderingIndex
    }: 
    { 
        sideEffects?: ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void,
        orderingIndex?: ( data: TDomain ) => number
    } = {}
    ) : AppendOnlyChildrenStream$<TDomain> {

    return new AppendOnlyChildrenStream$<TDomain>(
        stream$, 
        (data: TDomain, ...args:any[]) => vDomMap(data, ...args),
        { sideEffects, orderingIndex }
    )
}



/**
 * ## ReplaceChildrenStream$
 * 
 * Use case: when the emitting source of the array of domain data re-use some of its element.
 * 
 * In practice it is often used through the companion function [[childrenWithReplace$]]
 *  
 * For instance:
 *
 *```typescript
 * class DomainData{ 
 *    constructor( public readonly value: string){}
 *}
 *let hello = new DomainData("hello")
 *let world = new DomainData("world")
 *let foo = new DomainData("foo")
 *let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
 *let vDOM = { 
 *    children: childrenWithReplace$(
 *        stream$,
 *        (data: DomainData) => ({innerText: data.value})
 *    )
 *}
 * body.appendChild(render(vDOM))
 * //<div> 
 * //    <div> hello </div> 
 * //    <div> world </div> 
 * //</div>
 * stream$.next([hello, foo])
 * //<div> 
 * //    <div> hello </div> 
 * //    <div> foo </div> 
 * //</div>
 *```
 * The key points in the above example is that when *stream$.next([hello, foo])* is called:
 * -    ```<div> hello </div>``` was not re-rendered in any way
 * -    ```<div> world </div>``` has been removed 
 * -    ```<div> foo </div>``` has been added
 * -    the policy does domain data comparison (to identify which elements are new or old) using reference by default,
 * a custom comparison operator can also be supplied.
 */ 
export class ReplaceChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

    /**
     * Comparison operator used to identify which elements need to be added/ updated/ replaced.
     * By default reference equality is used, ideal when the domain data are immutables.
     */
     public readonly comparisonOperator : (rhs:TDomain,lhs:TDomain)=> boolean

    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM ,
        { comparisonOperator, sideEffects }: { comparisonOperator: (rhs:TDomain,lhs:TDomain)=> boolean, sideEffects }
        ) {
        super(stream$, map, {sideEffects})
        this.comparisonOperator = comparisonOperator || ((a,b) => a==b )
    }

    private actualElements : RefElement<TDomain>[] = []
    
    protected update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>
        ) : RenderingUpdate<TDomain> {

            let actualData = this.actualElements.map( refElem => refElem.domainData)
            let newData = domainData
            .filter( d1 =>  actualData.find( d0 => this.comparisonOperator(d0,d1)) == undefined)

            let deletedRefElem = this.actualElements
            .filter( d0 => domainData.find( d1 => this.comparisonOperator(d0.domainData, d1)) == undefined)
            
            let vDOMs = newData.map( d => this.map(d))
            deletedRefElem.forEach( elem => elem.element.remove())

            let rendered = vDOMs.map( vDOM => render(vDOM))
            rendered.forEach( div => parentElement.appendChild(div))
            
            let added = newData.map( (d,i) => 
                new RefElement<TDomain>({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}) 
            ) 
                
            let update = new RenderingUpdate(added, [], deletedRefElem )

            this.actualElements = [
                ...this.actualElements.filter( d =>  domainData.includes(d.domainData)),
                ...added 
            ]
            return update
        }
}

/**
 * ## childrenWithReplace$
 * 
 * Creation function companion of [[ReplaceChildrenStream$]].
 *
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between DomainData and [[VirtualDOM]]
 * @param comparisonOperator see [[ReplaceChildrenStream$.comparisonOperator]]
 * @param sideEffects Callback called after modification of the view, provided arguments are:
 * -    parent: [[HTMLElement$]] parent element
 * -    update: description of the update using [[RenderingUpdate]]
 * @returns 
 * @template TDomain Domain data type
 */
export function childrenWithReplace$<TDomain=unknown>(

    stream$: Observable<Array<TDomain>>,
    vDomMap: (TDomain, ...args: any[]) => VirtualDOM,
    {   comparisonOperator,
        sideEffects
    }: 
    { 
        comparisonOperator?: (rhs:TDomain,lhs:TDomain)=> boolean,
        sideEffects?: ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void 
    } 
    ) : ReplaceChildrenStream$<TDomain> {

    return new ReplaceChildrenStream$<TDomain>(
        stream$, 
        (data: TDomain, ...args:any[]) => vDomMap(data, ...args),
        { comparisonOperator, sideEffects }
    )
}
