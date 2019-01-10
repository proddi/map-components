import {html, render} from 'https://unpkg.com/lit-html?module';
import {repeat} from "https://unpkg.com/lit-html/directives/repeat?module";
import {BaseRouter} from '../generics.js';

import 'https://unpkg.com/@polymer/paper-item/paper-icon-item.js?module';
import 'https://unpkg.com/@polymer/paper-item/paper-item-body.js?module';
import 'https://unpkg.com/@polymer/iron-icons@3.0.1/iron-icons.js?module';
import 'https://unpkg.com/@polymer/iron-icons@3.0.1/maps-icons.js?module';


/**
 * Selector watches a router and emits style events according to user input (mouse)
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-selector router="#router"></route-selector>
 *
 * @listens {BaseRouter#request} to clear the list (loading state).
 * @listens {BaseRouter#response} to update the list.
 * @emits {RouteSelector#RouteSelected} when a route gets selected.
 * @emits {RouteSelector#RouteUnselected} when a route gets selected.
 * @emits {RouteSelector#RouteLegSelected} when a route gets selected.
 * @emits {RouteSelector#RouteLegUnselected} when a route gets selected.
 *
 **/
class RouteSelector extends HTMLElement {

    constructor() {
        super();

        // get templates
        this._rootTemplate = getBaseRenderer(this);
        this._routeTemplate = getDefaultRouteTemplate(this);

        // prepare root
        this.attachShadow({mode: 'open'});
        this.clearRoutes();

        /** @type {Response|undefined} */
        this.response = undefined;

        /** @type {Route|undefined} */
        this.selectedRoute = undefined;

        // router event handler
        this._routeRequestHandler  = (ev) => this.showLoading(ev.detail);
        this._routeResponseHandler = (ev) => this.showResponse(ev.detail);
        this._routeRoutesHandler   = (ev) => this.addRoutes(ev.detail.routes);
        this._routeErrorHandler    = (ev) => this.showError(ev.detail);
/*
        // mouse events
        this.shadowRoot.addEventListener("mouseover", (ev) => {
            let route = this._findRouteByNode(ev.target);
            route && this.highlightRoute(route);
        });
        this.shadowRoot.addEventListener("mouseout", (ev)  => {
            let route = this._findRouteByNode(ev.target);
            route && this.unhighlightRoute(route);
        });
        this.shadowRoot.addEventListener("click", (ev) => {
            let route = this._findRouteByNode(ev.target);
            route && this.toggleSelectRoute(route);
        });
*/
    }

    connectedCallback() {
        if (this.router === undefined) this.setRouter(this.getAttribute("router"));
    }

    clearRoutes() {
        render(this._rootTemplate({}, this._routeTemplate), this.shadowRoot);
    }

    addRoutes(routes) {
        console.warn("NOT IMPLEMENTED");
    }

    showLoading(request) {
        this.clearRoutes();
    }

    showResponse(response) {
        render(this._rootTemplate(response, this._routeTemplate), this.shadowRoot);
    }

    showError(error) {
        console.trace("NOT IMPLEMENTED");
    }

    /**
     * sets a new router source
     * @param {BaseRouter|DOMSelector} router - The new routes source
     */
    setRouter(router) {
        // ensure a BaseRouter instance
        if (!(router instanceof BaseRouter)) router = document.querySelector(router);

        // unregister events @old router
        if (this.router) {
            this.router.removeEventListener("request", this._routeRequestHandler);
            this.router.removeEventListener("response", this._routeResponseHandler);
            this.router.removeEventListener("routes", this._routeRoutesHandler);
            this.router.removeEventListener("error", this._routeErrorHandler);
            this.clearRoutes();
        }

        this.router = router;

        // register events @new router
        if (this.router) {
            this.router.addEventListener("request", this._routeRequestHandler);
            this.router.addEventListener("response", this._routeResponseHandler);
            this.router.addEventListener("routes", this._routeRoutesHandler);
            this.router.addEventListener("error", this._routeErrorHandler);
        // set current state
//          this.showLoading(router.currentRequest);
            router.currentResponse && this.showResponse(router.currentResponse);
//            router.currentRoutes && this.addRoutes(router.currentRoutes);
//            router.currentError && this.showError(router.currentError);
        }
    }

    highlightRoute(route) {
        this.dispatchEvent(new CustomEvent('highlighted', { detail: route }));
    }

    unhighlightRoute(route) {
        this.dispatchEvent(new CustomEvent('unhighlighted', { detail: route }));
    }

    selectRoute(route) {
        if (route === this.selectedRoute) return;
        this.selectedRoute && this.dispatchEvent(new CustomEvent('unselected', { detail: this.selectedRoute }));
        this.selectedRoute = route;
        this.selectedRoute && this.dispatchEvent(new CustomEvent('selected', { detail: this.selectedRoute }));
    }

    toggleSelectedRoute(route) {
        this.selectRoute(route === this.selectedRoute ? undefined : route);
    }
}


/**
 * Extracts a template content from {DOMNode} specified via {DOMSelector}
 */
function elementTemplate(node, ...fields) {
    let data_as = node.getAttribute("data-as") || "data";
    let markup = node.innerHTML.trim()
        .replace("=&gt;", "=>");
    node.parentNode.removeChild(node);
    let fn = Function.apply(null, ["html", data_as].concat(fields.map(([name, lookup]) => name)).concat([`return html\`${markup}\`;`]));
    return (...args) => fn(html, args[0], ...fields.map(([name, lookup]) => lookup(...args)));
}


function getBaseRenderer(scope) {
    return (response, routeTemplate) => html`
    <style>
        :host {
            display: block;
        }
        :host .route-lines {
            background-color: #f0f0f0;
            width: 100%;
            border-radius: 0.9rem;
            height: 0.3rem;
            margin: 0.2rem 0 0.3rem 0;
        }
        :host .route-lines > span {
            display: inline-block;
            vertical-align: top;
            borde_r-radius: 0.9rem;
            height: 0.3rem;
            b_order-left: 2px solid white;
            border-right: 2px solid white;
            background-color: #b7b9bc;
        }
        :host .route-lines > span.walk {
            background-color: #b7b9bc;
        }
        :host .route-lines > span.car {
            background-color: #2c48a1;
        }
        :host .provider {
            float: right;
        }
        :host paper-icon-item {
            cursor: pointer;
        }
        :host paper-icon-item:hover {
            background-color: #f0f0f0;
        }
    </style>

    <div role="listbox">
        <div>${response.error}</div>
        ${repeat(response.routes || [], (route) => route.id, (route, index) => routeTemplate(route, response))}
    <p></p>
    </div>
`;
}


function getDefaultRouteTemplate(self) {
    return (route, response) => html`
      <paper-icon-item data-route="${route.uid}"
            @click=${_ => self.toggleSelectedRoute(route)}
            @mouseenter=${_ => self.highlightRoute(route)}
            @mouseleave=${_ => self.unhighlightRoute(route)}>
        <iron-icon icon="maps:directions-transit" slot="item-icon"></iron-icon>
        <paper-item-body three-line>
          <div>${route.duration}</div>
          <div secondary>
            <div class="route-modes">
                ${route.legs.filter(leg => leg.transport.type !== "walk").map(leg => html`<span class="leg leg-${leg.transport.type}" title="${leg.summary || ''}" style="color: ${leg.transport.color};">${leg.transport.name}</span>  &rsaquo; `)}
            </div>
            <div class="route-lines">
                ${foo(response, route).map(([leg, width]) => html`<span class="${leg.transport.type}" title="${leg.summary || ''}" style="width: ${width}%; background-color: ${leg.transport.color};"></span>`)}
            </div>
            <div class="route-details">
                <span class="provider">${route.router.name}</span>
                Leave: ${route.departure.timeString} -&gt; ${route.arrival.timeString}
            </div>
          </div>
        </paper-item-body>
      </paper-icon-item>
`;
}

import {Leg, Transport} from '../generics.js';
import {formatTime} from './tools.js';


const WAITING = new Transport({type: "wait", name: "wait", color: "transparent", summary: "Waiting..."});

function foo(response, route) {
    let departure = response.routes.map(route => route.departure).reduce((prev, curr) => curr.time < prev.time ? curr : prev);
    let arrival = response.routes.map(route => route.arrival).reduce((prev, curr) => curr.time > prev.time ? curr : prev);
    let duration = (arrival.time - departure.time) / 100;
//    console.log(route.id, formatTime(departure.time), formatTime(arrival.time), duration);
    let waiting = new Leg(departure, route.legs[0].departure, WAITING, [], {id:"0", summary: "wait here"});
    return [waiting].concat(route.legs).map(leg => [leg, (leg.arrival.time - leg.departure.time)/duration]);
}



customElements.define('route-selector', RouteSelector);


export { RouteSelector }
