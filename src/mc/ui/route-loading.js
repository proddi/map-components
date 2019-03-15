import {html, render} from '../../mc/lit-html.js';
import {RouteObserver} from '../../mc/mixins.js';


/**
 * An spinner that's visible when the {@link RouteSource} is requesting.
 *
 * @example <caption>used in route-selector</caption>
 * <router role="route-source" ...></router>
 *
 * <route-selector>
 *   <route-spinner slot="center"></route-spinner>
 * </route-selector>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteLoading extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        render(this.render(), this.shadowRoot);
    }

    onRouteRequest(request) {
        this.setAttribute("active", "");
    }

    onRouteResponse(response, intermediate) {
        if (!intermediate) {
            this.removeAttribute("active");
        }
    }

    render() {
        return html`
        <style>
            :host {
                display: block;
            }
            :host > ::slotted(*) {
                opacity: 0;
                transition: opacity .3s ease;
            }
            :host([active]) > ::slotted(*) {
                opacity: 1;
            }
        </style>
        <slot>Loading...</slot>
    `;
    }

}


customElements.define('route-loading', RouteLoading);


export { RouteLoading }
