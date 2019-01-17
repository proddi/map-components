import {buildURIParams} from '../generics.js';

/**
 * Adds history support by implementing browsers history-api.
 *
 * @example
 * <mc-history/>
 *
 * <mc-map center="13,52" zoom="11"></mc-map>
 **/
class History extends HTMLElement {
    constructor() {
        super();

        this.state = history.state || (()=> {
                let params = {};
                for (let [key, val] of (new URL(document.location)).searchParams.entries()) params[key] = val;
                return params;
            })();
    }

    replace(params={}) {
        Object.assign(this.state, params);
//        console.log("HISTORY.replace()", this.state);
        history.replaceState(this.state, "", buildURIParams(this.state));
    }

    push(params={}) {
        Object.assign(this.state, params);
//        console.log("HISTORY.push()", this.state);
        history.pushState(this.state, "", buildURIParams(this.state));
    }

    get(key=undefined) {
        return key === undefined ? this.state : this.state[key];
    }
}


customElements.define("mc-history", History);


export { History }
