import {html, render, repeat} from '../map/lit-html.js';
import {BaseRouter} from '../generics.js';
import {elementTemplate} from '../map/tools.js';
import {SelectorMixin, RouterMixin} from '../map/mixins.js';

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
 * @extends {HTMLElement}
 * @implements {SelectorMixin}
 * @implements {RouterMixin}
 * @l_istens {BaseRouter#request} to clear the list (loading state).
 * @l_istens {BaseRouter#response} to update the list.
 * @e_mits {RouteSelector#RouteSelected} when a route gets selected.
 * @e_mits {RouteSelector#RouteUnselected} when a route gets selected.
 * @e_mits {RouteSelector#RouteLegSelected} when a route gets selected.
 * @e_mits {RouteSelector#RouteLegUnselected} when a route gets selected.
 *
 **/
class RouteSelector extends RouterMixin(SelectorMixin(HTMLElement)) {
    /** @private */
    constructor() {
        super();

        // get templates
        this._baseRenderer = baseRenderer;
        this._routeRenderer = routeRenderer;

        // prepare root
        this.attachShadow({mode: 'open'});
//        this.clearRoutes();

    }

    onRouteRequest(request) {
        this.showLoading(request);
        this.clearItems();
    }

    onRouteResponse(response) {
        this.showResponse(response);
        this.setItems(response.routes);
    }

    clearRoutes() {
        render(this._baseRenderer(this, {}, this._routeRenderer), this.shadowRoot);
    }

//    addRoutes(routes) {
//        console.warn("NOT IMPLEMENTED");
//    }

    showLoading(request) {
        this.clearItems();
        this.clearRoutes();
    }

    showResponse(response) {
        render(this._baseRenderer(this, response, this._routeRenderer), this.shadowRoot);
    }

//    showError(error) {
//        console.trace("NOT IMPLEMENTED");
//    }
    highlightRoute(route) {
        this.dispatchEvent(new CustomEvent('highlighted', { detail: route }));
    }

    unhighlightRoute(route) {
        this.dispatchEvent(new CustomEvent('unhighlighted', { detail: route }));
    }
}


import {Leg, Transport} from '../generics.js';


const WAITING = new Transport({type: "wait", name: "wait", color: "transparent", summary: "Waiting..."});

function foo(response, route) {
    let departure = response.routes.map(route => route.departure).reduce((prev, curr) => curr.time < prev.time ? curr : prev);
    let arrival = response.routes.map(route => route.arrival).reduce((prev, curr) => curr.time > prev.time ? curr : prev);
    let duration = (arrival.time - departure.time) / 100;
    let waiting = new Leg(departure, route.legs[0].departure, WAITING, [], {id:"0", summary: "wait here"});
    return [waiting].concat(route.legs).map(leg => [leg, (leg.arrival.time - leg.departure.time)/duration]);
}


function baseRenderer(self, response, routeTemplate) {
    return html`
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
            height: 0.3rem;
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
            background-color: rgba(128, 128, 128, .12);
        }
    </style>

    <div role="listbox">
        <div>${response.error}</div>
        ${repeat(response.routes || [], (route) => route.id, (route, index) => routeTemplate(self, route, response))}
    </div>
`;
}


function routeRenderer(self, route, response) {
    return html`
      <paper-icon-item data-route="${route.uid}"
            @click=${_ => self.selectItem(route)}
            @mouseenter=${_ => self.emphasizeItem(route, "highlighted")}
            @mouseleave=${_ => self.emphasizeItem(route)}>
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


customElements.define('route-selector', RouteSelector);


export { RouteSelector }
