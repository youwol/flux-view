
import * as All from "./html-elements";

let CustomElements = {
    'div' : All.HTMLDivElement$ ,
    'header' : All.HTMLHeaderElement$,
    'section': All.HTMLSectionElement$,
    'span' : All.HTMLSpanElement$ ,
    'h1' : All.HTMLH1Element$ ,
    'h2' : All.HTMLH2Element$ ,
    'h3' : All.HTMLH3Element$ ,
    'h4' : All.HTMLH4Element$ ,
    'h5' : All.HTMLH5Element$ ,
    'h6' : All.HTMLH6Element$ ,
    'input' : All.HTMLInputElement$,
    'label' : All.HTMLLabelElement$,
    'i' : All.HTMLIElement$,
    'a' : All.HTMLAnchorElement$,
    'button' : All.HTMLButtonElement$,
}

function register() {
    customElements.define('fv-placeholder', All.HTMLPlaceHolderElement);

    Object.entries(CustomElements).forEach( ([k,v]) => {
        customElements.define( `fv-${k}`, v, { extends: k })
    })
}

register()


export function factory(tag: string = 'div'):  All.HTMLElement${

    if(!CustomElements[tag])
        throw Error(`The element ${tag} is not registered in barbouille's factory`)

    let div = document.createElement(tag,{ is:`fv-${tag}` } ) as any
    return div as  All.HTMLElement$
}


