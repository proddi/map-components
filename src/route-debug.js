import {html, render} from 'https://unpkg.com/lit-html?module';
import {RouteObserver} from './map/mixins.js';


/**
 * Displays an ugly but copyable string about the current route.
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-debug router="#router"></route-debug>
 **/
class RouteDebug extends RouteObserver(HTMLElement) {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    onRouteRequest(request) {
        render(TEMPLATE(request), this.shadowRoot);
    }
}


const TEMPLATE = (request) => html`
        <style>
            :host {
                border: 2px solid blue;
                d_isplay: block;
                background-color: rgba(255, 0, 0, .8);
            }
        </style>
        <div>start=<span>"${request.start.lng},${request.start.lat}"</span> dest=<span>"${request.dest.lng},${request.dest.lat}"</span> time=<span>"${request.time.toISOString()}"</span></div>
    `;


customElements.define("route-debug", RouteDebug);


export { RouteDebug }
