import {BaseRouter, parseCoordString, parseTimeString, findRootElement} from './generics.js';


/**
 * Contains a clickable route
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-link router="#router" start="lat,lng" dest="lat,lng" time=".."></route-link>
 **/
class RouteLink extends HTMLElement {
    constructor() {
        super();

        this.addEventListener("click", (ev) => {
            let router = findRootElement(this, this.getAttribute("router"), BaseRouter);
            router.update({
                    start: this.getAttribute("start"),
                    dest:  this.getAttribute("dest"),
                    time:  this.getAttribute("time"),
                });
        });
    }
}


customElements.define("route-link", RouteLink);


export { RouteLink }
