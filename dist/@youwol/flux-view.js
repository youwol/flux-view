!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("rxjs/operators")):"function"==typeof define&&define.amd?define("@youwol/flux-view",[],t):"object"==typeof exports?exports["@youwol/flux-view"]=t(require("rxjs/operators")):e["@youwol/flux-view"]=t(e.rxjs.operators)}("undefined"!=typeof self?self:this,(function(e){return function(e){var t={};function n(l){if(t[l])return t[l].exports;var r=t[l]={i:l,l:!1,exports:{}};return e[l].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=e,n.c=t,n.d=function(e,t,l){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:l})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var l=Object.create(null);if(n.r(l),Object.defineProperty(l,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(l,r,function(t){return e[t]}.bind(null,r));return l},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(t,n){t.exports=e},function(e,t,n){"use strict";n.r(t),n.d(t,"attr$",(function(){return m})),n.d(t,"child$",(function(){return s})),n.d(t,"render",(function(){return T}));var l=n(0);class r{constructor(e,t,{untilFirst:n,wrapper:l,sideEffects:r}){this.stream$=e,this.map=t,this.untilFirst=n,this.wrapper=l,this.map=t,this.sideEffects=r}subscribe(e,...t){let n=this.stream$.pipe(Object(l.map)((e,...n)=>this.map(e,...t)));return this.untilFirst&&this.finalize(e,this.untilFirst),n.subscribe(t=>{this.finalize(e,t)})}finalize(e,t){let n=this.wrapper?this.wrapper(t):t,l=e(n);this.sideEffects&&this.sideEffects(n,l)}}function i(e,t,{untilFirst:n,wrapper:l,sideEffects:i}={}){return new r(e,(e,...n)=>t(e,...n),{untilFirst:n,wrapper:l,sideEffects:i})}let s=i,m=i,o={a:HTMLAnchorElement,abbr:HTMLElement,address:HTMLElement,area:HTMLAreaElement,article:HTMLElement,aside:HTMLElement,audio:HTMLAudioElement,b:HTMLElement,base:HTMLBaseElement,bdi:HTMLElement,bdo:HTMLElement,blockquote:HTMLQuoteElement,body:HTMLBodyElement,br:HTMLBRElement,button:HTMLButtonElement,canvas:HTMLCanvasElement,caption:HTMLTableCaptionElement,cite:HTMLElement,code:HTMLElement,col:HTMLTableColElement,colgroup:HTMLTableColElement,data:HTMLDataElement,datalist:HTMLDataListElement,dd:HTMLElement,del:HTMLModElement,details:HTMLDetailsElement,dfn:HTMLElement,dialog:HTMLDialogElement,dir:HTMLDirectoryElement,div:HTMLDivElement,dl:HTMLDListElement,dt:HTMLElement,em:HTMLElement,embed:HTMLEmbedElement,fieldset:HTMLFieldSetElement,figcaption:HTMLElement,figure:HTMLElement,font:HTMLFontElement,footer:HTMLElement,form:HTMLFormElement,frame:HTMLFrameElement,frameset:HTMLFrameSetElement,h1:HTMLHeadingElement,h2:HTMLHeadingElement,h3:HTMLHeadingElement,h4:HTMLHeadingElement,h5:HTMLHeadingElement,h6:HTMLHeadingElement,head:HTMLHeadElement,header:HTMLElement,hgroup:HTMLElement,hr:HTMLHRElement,html:HTMLHtmlElement,i:HTMLElement,iframe:HTMLIFrameElement,img:HTMLImageElement,input:HTMLInputElement,ins:HTMLModElement,kbd:HTMLElement,label:HTMLLabelElement,legend:HTMLLegendElement,li:HTMLLIElement,link:HTMLLinkElement,main:HTMLElement,map:HTMLMapElement,mark:HTMLElement,marquee:HTMLMarqueeElement,menu:HTMLMenuElement,meta:HTMLMetaElement,meter:HTMLMeterElement,nav:HTMLElement,noscript:HTMLElement,object:HTMLObjectElement,ol:HTMLOListElement,optgroup:HTMLOptGroupElement,option:HTMLOptionElement,output:HTMLOutputElement,p:HTMLParagraphElement,param:HTMLParamElement,picture:HTMLPictureElement,pre:HTMLPreElement,progress:HTMLProgressElement,q:HTMLQuoteElement,rp:HTMLElement,rt:HTMLElement,ruby:HTMLElement,s:HTMLElement,samp:HTMLElement,script:HTMLScriptElement,section:HTMLElement,select:HTMLSelectElement,slot:HTMLSlotElement,small:HTMLElement,source:HTMLSourceElement,span:HTMLSpanElement,strong:HTMLElement,style:HTMLStyleElement,sub:HTMLElement,summary:HTMLElement,sup:HTMLElement,table:HTMLTableElement,tbody:HTMLTableSectionElement,td:HTMLTableCellElement,template:HTMLTemplateElement,textarea:HTMLTextAreaElement,tfoot:HTMLTableSectionElement,th:HTMLTableCellElement,thead:HTMLTableSectionElement,time:HTMLTimeElement,title:HTMLTitleElement,tr:HTMLTableRowElement,track:HTMLTrackElement,u:HTMLElement,ul:HTMLUListElement,var:HTMLElement,video:HTMLVideoElement,wbr:HTMLElement};u(HTMLElement);class a extends HTMLElement{constructor(){super()}initialize(e){this.currentElement=this;let t=e=>{let t=T(e);return this.currentElement.replaceWith(t),this.currentElement=t,t};return e.subscribe(e=>t(e))}}const E={class:(e,t)=>e.className=t,style:(e,t)=>{Object.entries(t).forEach(([t,n])=>e.style[t]=n)}};function u(e){return class extends e{constructor(...e){super(...e),this.subscriptions=new Array}initialize(e){this.vDom=e}connectedCallback(){let e=Object.entries(this.vDom).filter(([e,t])=>"children"!=e&&!(t instanceof r)),t=Object.entries(this.vDom).filter(([e,t])=>"children"!=e&&t instanceof r);e.forEach(([e,t])=>{this.applyAttribute(e,t)}),t.forEach(([e,t])=>{this.subscriptions.push(t.subscribe(t=>this.applyAttribute(e,t),this))}),this.vDom.children&&this.vDom.children.forEach(e=>{if(e instanceof r){let t=document.createElement("fv-placeholder");this.appendChild(t),this.subscriptions.push(t.initialize(e))}else{let t=T(e);this.appendChild(t)}})}disconnectedCallback(){this.subscriptions.forEach(e=>e.unsubscribe())}applyAttribute(e,t){E[e]?E[e](this,t):this[e]=t}}}function T(e){let t=function(e="div"){if(!o[e])throw Error(`The element ${e} is not registered in flux-view's factory`);return document.createElement(e,{is:"fv-"+e})}(e.tag);return t.initialize(e),t}customElements.define("fv-placeholder",a),Object.entries(o).forEach(([e,t])=>{!function(e,t){class n extends(u(t)){constructor(){super()}}customElements.define("fv-"+e,n,{extends:e})}(e,t)})}])}));
//# sourceMappingURL=flux-view.js.map