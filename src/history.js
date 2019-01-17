/**
 * Displays an ugly but copyable string about the current route.
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-debug router="#router"></route-debug>
 **/
class History extends HTMLElement {
    constructor() {
        super();
        this._params = {}
    }


    connectedCallback() {
    }


    replace(params={}) {
        Object.assign(this._params, params);
        console.log("HISTORY.replace()", this._params);
    }

    push(params={}) {
        Object.assign(this._params, params);
        console.log("HISTORY.push()", this._params);
    }
}


customElements.define("mc-history", RouteDebug);


export { History }
