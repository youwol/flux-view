(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("@youwol/flux-view", [], factory);
	else if(typeof exports === 'object')
		exports["@youwol/flux-view"] = factory();
	else
		root["@youwol/flux-view"] = factory();
})((typeof self !== 'undefined' ? self : this), function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! exports provided: Stream$, child$, attr$, _$, render */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/core */ "./lib/core.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Stream$", function() { return _lib_core__WEBPACK_IMPORTED_MODULE_0__["Stream$"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "child$", function() { return _lib_core__WEBPACK_IMPORTED_MODULE_0__["child$"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "attr$", function() { return _lib_core__WEBPACK_IMPORTED_MODULE_0__["attr$"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "_$", function() { return _lib_core__WEBPACK_IMPORTED_MODULE_0__["_$"]; });

/* harmony import */ var _lib_vdom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/vdom */ "./lib/vdom.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "render", function() { return _lib_vdom__WEBPACK_IMPORTED_MODULE_1__["render"]; });

/*
 * Public API Surface of flux-lib-core
 */




/***/ }),

/***/ "./lib/core.ts":
/*!*********************!*\
  !*** ./lib/core.ts ***!
  \*********************/
/*! exports provided: Stream$, child$, attr$, _$ */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Stream$", function() { return Stream$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "child$", function() { return child$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attr$", function() { return attr$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_$", function() { return _$; });
/* harmony import */ var _vdom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vdom */ "./lib/vdom.ts");
// hack until figuring out how to properly bind 'rxjs/oprators' as external in webpack
//import { map } from "rxjs/operators";
let operators = window['rxjs']['operators'];

class Stream$ {
    constructor(stream$, { untilFirst, wrapper, map, sideEffects } = {}) {
        this.stream$ = stream$;
        this.untilFirst = untilFirst;
        this.wrapper = wrapper;
        this.map = map;
        this.sideEffects = sideEffects;
    }
    subscribe(fct, ...withData) {
        let stream$ = this.map
            ? this.stream$.pipe(operators.map((d, ...args) => this.map(d, ...withData)))
            : this.stream$;
        if (this.untilFirst) {
            let vWrapped = this.wrapper ? this.wrapper(this.untilFirst) : this.untilFirst;
            let v1 = fct(vWrapped);
            this.sideEffects && this.sideEffects(vWrapped, v1);
            this.wrapper ? fct(this.wrapper(this.untilFirst)) : fct(this.untilFirst);
        }
        return stream$.subscribe((v) => {
            let vWrapped = this.wrapper ? this.wrapper(v) : v;
            let v1 = fct(vWrapped);
            this.sideEffects && this.sideEffects(vWrapped, v1);
        });
    }
}
function child$(stream$, vDomMap, { untilFirst, wrapper, sideEffects } = {}) {
    return new Stream$(stream$.pipe(operators.map((data) => vDomMap(data))), { untilFirst, wrapper, sideEffects });
}
function attr$(stream$, attrMap, { untilFirst, wrapper } = {}) {
    return new Stream$(stream$, { untilFirst, wrapper, map: (data, ...args) => attrMap(data, ...args) });
}
const specialBindings = {
    class: (instance, value) => instance.className = value,
    style: (instance, value) => {
        Object.entries(value).forEach(([k, v]) => instance.style[k] = v);
    }
};
function _$(Base) {
    return class extends Base {
        constructor(...args) {
            super(...args);
            this.subscriptions = new Array();
        }
        initialize(vDom) {
            this.vDom = vDom;
        }
        connectedCallback() {
            let attributes = Object.entries(this.vDom).filter(([k, v]) => k != 'children' && !(v instanceof Stream$));
            let attributes$ = Object.entries(this.vDom).filter(([k, v]) => k != 'children' && (v instanceof Stream$));
            attributes.forEach(([k, v]) => {
                this.applyAttribute(k, v);
            });
            attributes$.forEach(([k, attr$]) => {
                this.subscriptions.push(attr$.subscribe((v) => this.applyAttribute(k, v), this));
            });
            this.vDom.children && this.vDom.children.forEach((child) => {
                if (child instanceof Stream$) {
                    let placeHolder = document.createElement('fv-placeholder');
                    this.appendChild(placeHolder);
                    this.subscriptions.push(placeHolder.initialize(child));
                }
                else {
                    let div = Object(_vdom__WEBPACK_IMPORTED_MODULE_0__["render"])(child);
                    this.appendChild(div);
                }
            });
        }
        ;
        disconnectedCallback() {
            this.subscriptions.forEach(s => s.unsubscribe());
        }
        applyAttribute(name, value) {
            specialBindings[name]
                ? specialBindings[name](this, value)
                : this[name] = value;
        }
    };
}


/***/ }),

/***/ "./lib/factory.ts":
/*!************************!*\
  !*** ./lib/factory.ts ***!
  \************************/
/*! exports provided: factory */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "factory", function() { return factory; });
/* harmony import */ var _html_elements__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./html-elements */ "./lib/html-elements.ts");

let CustomElements = {
    'div': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLDivElement$"],
    'header': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLHeaderElement$"],
    'section': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLSectionElement$"],
    'span': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLSpanElement$"],
    'h1': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH1Element$"],
    'h2': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH2Element$"],
    'h3': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH3Element$"],
    'h4': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH4Element$"],
    'h5': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH5Element$"],
    'h6': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLH6Element$"],
    'input': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLInputElement$"],
    'label': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLLabelElement$"],
    'i': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLIElement$"],
    'a': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLAnchorElement$"],
    'button': _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLButtonElement$"],
};
function register() {
    customElements.define('fv-placeholder', _html_elements__WEBPACK_IMPORTED_MODULE_0__["HTMLPlaceHolderElement"]);
    Object.entries(CustomElements).forEach(([k, v]) => {
        customElements.define(`fv-${k}`, v, { extends: k });
    });
}
register();
function factory(tag = 'div') {
    if (!CustomElements[tag])
        throw Error(`The element ${tag} is not registered in barbouille's factory`);
    let div = document.createElement(tag, { is: `fv-${tag}` });
    return div;
}


/***/ }),

/***/ "./lib/html-elements.ts":
/*!******************************!*\
  !*** ./lib/html-elements.ts ***!
  \******************************/
/*! exports provided: HTMLPlaceHolderElement, HTMLElement$, HTMLDivElement$, HTMLSpanElement$, HTMLH1Element$, HTMLH2Element$, HTMLH3Element$, HTMLH4Element$, HTMLH5Element$, HTMLH6Element$, HTMLHeaderElement$, HTMLSectionElement$, HTMLInputElement$, HTMLLabelElement$, HTMLIElement$, HTMLAnchorElement$, HTMLButtonElement$ */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLPlaceHolderElement", function() { return HTMLPlaceHolderElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLElement$", function() { return HTMLElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLDivElement$", function() { return HTMLDivElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLSpanElement$", function() { return HTMLSpanElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH1Element$", function() { return HTMLH1Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH2Element$", function() { return HTMLH2Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH3Element$", function() { return HTMLH3Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH4Element$", function() { return HTMLH4Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH5Element$", function() { return HTMLH5Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLH6Element$", function() { return HTMLH6Element$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLHeaderElement$", function() { return HTMLHeaderElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLSectionElement$", function() { return HTMLSectionElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLInputElement$", function() { return HTMLInputElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLLabelElement$", function() { return HTMLLabelElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLIElement$", function() { return HTMLIElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLAnchorElement$", function() { return HTMLAnchorElement$; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "HTMLButtonElement$", function() { return HTMLButtonElement$; });
/* harmony import */ var _core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core */ "./lib/core.ts");
/* harmony import */ var _vdom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vdom */ "./lib/vdom.ts");


class HTMLPlaceHolderElement extends HTMLElement {
    constructor() {
        super();
    }
    initialize(stream$) {
        this.currentElement = this;
        let apply = (vDom) => {
            let div = Object(_vdom__WEBPACK_IMPORTED_MODULE_1__["render"])(vDom);
            this.currentElement.replaceWith(div);
            this.currentElement = div;
            return div;
        };
        return stream$.subscribe((vDom) => { return apply(vDom); });
    }
}
class HTMLElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLElement) {
    constructor() { super(); }
}
class HTMLDivElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLDivElement) {
    constructor() { super(); }
}
class HTMLSpanElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLSpanElement) {
    constructor() { super(); }
}
class HTMLH1Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLH2Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLH3Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLH4Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLH5Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLH6Element$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLHeadingElement) {
    constructor() { super(); }
}
class HTMLHeaderElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLElement) {
    constructor() { super(); }
}
class HTMLSectionElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLElement) {
    constructor() { super(); }
}
class HTMLInputElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLInputElement) {
    constructor() { super(); }
}
class HTMLLabelElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLLabelElement) {
    constructor() { super(); }
}
class HTMLIElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLElement) {
    constructor() { super(); }
}
class HTMLAnchorElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLAnchorElement) {
    constructor() { super(); }
}
class HTMLButtonElement$ extends Object(_core__WEBPACK_IMPORTED_MODULE_0__["_$"])(HTMLButtonElement) {
    constructor() { super(); }
}


/***/ }),

/***/ "./lib/vdom.ts":
/*!*********************!*\
  !*** ./lib/vdom.ts ***!
  \*********************/
/*! exports provided: render */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony import */ var _factory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./factory */ "./lib/factory.ts");

function render(vDom) {
    let element = Object(_factory__WEBPACK_IMPORTED_MODULE_0__["factory"])(vDom.tag);
    element.vDom = vDom;
    return element;
}


/***/ })

/******/ });
});
//# sourceMappingURL=flux-view.js.map