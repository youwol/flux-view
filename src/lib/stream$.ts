import { Observable } from "rxjs"
import { map } from "rxjs/operators"


export class Stream$<T0, T1 = T0> {

    public readonly untilFirst
    public readonly wrapper
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<T0>,
        public readonly map:  (T0,...args:any[])=>T1,
        { untilFirst, wrapper, sideEffects }: 
        { untilFirst?: T1, wrapper?: (T1) => T1 , 
          sideEffects?: (T1, T0) => void } ) {

        this.untilFirst = untilFirst
        this.wrapper = wrapper
        this.map = map
        this.sideEffects = sideEffects
    }

    subscribe( fct : (T,...args:any[]) => any, ...withData ) {

        let stream$ = this.stream$.pipe( map( (d: any, ...args:any[]) => this.map(d,...withData) ))
        
        this.untilFirst && this.finalize(fct,  this.untilFirst )
        
        return stream$.subscribe( (v:T1) => {
            this.finalize(fct, v )
        })
    }
    
    private finalize(fct : (T,...args:any[]) => any, value: T1){
        let vWrapped = this.wrapper ? this.wrapper(value) : value
        let v1 = fct(vWrapped)
        this.sideEffects && this.sideEffects(vWrapped, v1)
    }
}


function stream$<TDomain,TDom>(
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

export type AttributeType = number | string | boolean | {[key:string]:  number | string | boolean }

export let child$ = stream$ // this would be type specialization for TDom = VirtualDom
export let attr$ = stream$  // this would be type specialization for TDom = AttributeType
export let children$ = stream$ // this would be type specialization for TDom = Array<VirtualDom>
