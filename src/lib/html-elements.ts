import { Observable, Subscription } from "rxjs";
import { Stream$, _$} from "./core";
import { render, VirtualDOM } from "./vdom";


export class HTMLPlaceHolderElement extends HTMLElement{

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

export class HTMLElement$ extends _$(HTMLElement){
    constructor() {super();}
}
export class HTMLDivElement$ extends _$(HTMLDivElement){
    constructor() {super();}
}
export class HTMLSpanElement$ extends _$(HTMLSpanElement){
    constructor() {super();}
}
export class HTMLH1Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLH2Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLH3Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLH4Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLH5Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLH6Element$ extends _$(HTMLHeadingElement){
    constructor() {super();}
}
export class HTMLHeaderElement$ extends _$(HTMLElement){
    constructor() {super(); }
}
export class HTMLSectionElement$ extends _$(HTMLElement){
    constructor() {super(); }
}
export class HTMLInputElement$ extends _$(HTMLInputElement){
    constructor() {super(); }
}
export class HTMLLabelElement$ extends _$(HTMLLabelElement){
    constructor() {super(); }
}
export class HTMLIElement$ extends _$(HTMLElement){
    constructor() {super(); }
}
export class HTMLAnchorElement$ extends _$(HTMLAnchorElement){
    constructor() {super(); }
}
export class HTMLButtonElement$ extends _$(HTMLButtonElement){
    constructor() {super(); }
}