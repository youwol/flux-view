import { factory } from "./factory"



export interface VirtualDOM{

    tag?: string
    [key:string]: any
}

export interface  IHTMLElement$ extends HTMLElement{

    vDom: VirtualDOM
}


export function render( vDom:VirtualDOM ) : IHTMLElement$ {

    let element = factory(vDom.tag)
    element.vDom = vDom
    return element
}

