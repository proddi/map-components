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

        ensureStyles("route-link", `
route-link {
    border: 1px solid rgba(128, 128, 128, .5);
    box-shadow: 1px 1px 2px rgba(128, 128, 128, .5);
    border-radius: 2px;
    padding: 1px 5px;
    cursor: pointer;
}
route-link:hover {
    background-color: rgba(128, 128, 128, .15);
}
`)
    }
}


function ensureStyles(id, styles) {
    if (document.head.querySelector(`style[for="${id}"]`)) return;
    let style = document.createElement('style');
    style.setAttribute("for", id);
    style.textContent=styles;
    document.head.appendChild(style);
}


customElements.define("route-link", RouteLink);


export { RouteLink }
