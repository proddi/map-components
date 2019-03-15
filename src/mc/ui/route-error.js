import {html, render} from '../../mc/lit-html.js';
import {RouteObserver} from '../../mc/mixins.js';


/**
 * An label that is visible when an {@link RouteSource}'s {@link RouteResponse} indicates an failure.
 *
 * @example <caption>used in route-selector</caption>
 * <router role="route-source" ...></router>
 *
 * <route-selector>
 *   <route-error slot="center"></route-error>
 * </route-selector>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteError extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        // initial render
        render(baseRenderer({}), this.shadowRoot);
    }

    onRouteRequest(request) {
        this.removeAttribute("error");
    }

    onRouteResponse(response) {
        render(baseRenderer(response), this.shadowRoot);
        if (response.error) this.setAttribute("error", "");
    }
}


function baseRenderer(response) {
    return html`
    <style>
        :host {
            display: block;
        }
        :host > div {
            text-align: center;
            color: red;
            opacity: 0;
            transition: opacity .3s ease;
            padding: 20px;
        }
        :host([error]) > div {
            opacity: 1;
        }
    </style>
    <div>${response.error || ""}</div>
`;
}


customElements.define('route-error', RouteError);


export { RouteError }
