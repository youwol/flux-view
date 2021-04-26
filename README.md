<h1 align="center">Flux-view</h1>

<p>
    <a href="https://github.com/kefranabg/readme-md-generator/graphs/commit-activity" target="_blank">
        <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    </a>
</p>




## What is it?

Flux-view is a tiny library to render HTML documents using reactive programing primitives
(tiny meaning less than 10kB uncompressed - rxjs not included).
The library core concept is to allow binding DOM's attributes and children to RxJS streams in an HTML document:

```typescript
import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { render, attr$ } from '@youwol/flux-view'

const nCount = 10
// timer$: tick 10 times every seconds
const timer$ = interval(1000).pipe(  
    take(nCount), 
    map( tick => nCount - tick) 
)  

let vDom = { 
    tag:'div', 
    innerText: 'count down:', 
    children:[
        {   tag:'div',
            innerText: attr$( 
                // input stream (aka domain stream)
                timer$, 
                // rendering mapping
                (countDown:number) => `Remaining: ${countDown} s` 
            )
        }
    ]
}
let div : HTMLElement = render(vDom)
```
Few things to highlight:
- the dataflow of the application is described using RxJS. It provides an efficient and elegant way to deal with events and asynchronicity. The dataflow is explicit and usually composed of pure functions.
- the DOM is represented by a JSON data-structure (called virtual DOM or vDOM). All regular attributes of the DOM exist along with the *children* attributes to list children of the node.
- any attribute can be defined either by plain data or a stream (be it combination of multiple streams)

> For those having knowledge of RxJS and HTML, learning how to use the library will take a couple of minutes: the all API contains only 4 functions : *render*, *attr$*, *child$*, *children$*; the three latters are here essentially the same, they are differentiated as syntactic sugar. If not the case, learning how to use the library is learning reactive programming and HTML5.

Want to learn more? You can have a look to the [documentation](https://youwol.github.io/flux-view/dist/docs/modules/stream_.html)

## More elaborated examples

More elaborated example are provided in *codesandbox*:
- <a href='https://codesandbox.io/s/github/youwol/flux-view/blob/master/src/demos/todos?file=/index.html'>Todos application</a>: A todo application copied from the example of the *Vue* library and 'translated' into *flux-view*. The original code of the *View* version can be found <a href='https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-todomvc?from-embed=&file=/index.html:63-108'>here</a>.
- <a href='https://codesandbox.io/s/github/youwol/flux-view/blob/master/src/demos/timer?file=/index.html'>Count down</a>: A simple count down, includes some reactivity regarding mouse move.

Demos sources are in the folder */src/demos* (opening index.html in a browser will do the work).


# Install

Using npm:
```sh
npm install @youwol/flux-view
```
Using yarn:
```sh
yarn add @youwol/flux-view
```

And import the functions in your code:

```typescript
import {attr$, child$, render} from "@youwol/flux-view"
```

Or you can start scratching an index.html using CDN ressources like that:
```html
<html>
    <head>
        <script src="https://unpkg.com/rxjs@6/bundles/rxjs.umd.min.js">
        </script>
        <script src="https://unpkg.com/@youwol/flux-view@0.0.2/dist/@youwol/flux-view.js">
        </script>
    </head>

    <body id="container">

        <script>
            let [flux, rxjs] = [window['@youwol/flux-view'], window['rxjs']]  

            let vDom = { innerText: flux.attr$( rxjs.of("Hi! Happy fluxing!"), (d)=>d) }  

            document.getElementById("container").appendChild(flux.render(vDom))
        </script>
    </body>
</html>
```
