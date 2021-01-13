import { Observable } from "rxjs";
export declare class Stream$<T0, T1 = T0> {
    readonly stream$: Observable<T0>;
    readonly map: (T0: any, ...args: any[]) => T1;
    readonly untilFirst: any;
    readonly wrapper: any;
    readonly sideEffects: any;
    constructor(stream$: Observable<T0>, map: (T0: any, ...args: any[]) => T1, { untilFirst, wrapper, sideEffects }: {
        untilFirst?: T1;
        wrapper?: (T1: any) => T1;
        sideEffects?: (T1: any, T0: any) => void;
    });
    subscribe(fct: (T: any, ...args: any[]) => any, ...withData: any[]): import("rxjs").Subscription;
    private finalize;
}
declare function stream$<TDomain, TDom>(stream$: Observable<TDomain>, vDomMap: (TDomain: any, ...args: any[]) => TDom, { untilFirst, wrapper, sideEffects }?: {
    untilFirst?: TDom;
    wrapper?: (TDom: any) => TDom;
    sideEffects?: (TDomain: any, HTMLElement: any) => void;
}): Stream$<TDomain, TDom>;
export declare type AttributeType = number | string | boolean | {
    [key: string]: number | string | boolean;
};
export declare let child$: typeof stream$;
export declare let attr$: typeof stream$;
export {};
