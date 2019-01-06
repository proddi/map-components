import {html, render} from 'https://unpkg.com/lit-html?module';
import {repeat} from "https://unpkg.com/lit-html/directives/repeat?module";
import {BaseRouter} from './generics.js';


/**
 * Selector watches a router and emits style events according to user input (mouse)
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-selector router="#router></route-selector>
 *
 * @emits
 * styles
 *
 **/
class RouteSelector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        render(MARKUP(), this.shadowRoot);
        this._root = this.shadowRoot.querySelector("div");

        /** @type {?BaseRouter} */
        this.router = undefined;

        this._routes = [];
        this._error = undefined;
        this._selectedRoute = undefined;
        this._highlightedRoutes = [];

        // router event handler
        this._routeRequestHandler  = (ev) => this.showLoading(ev.detail);
        this._routeResponseHandler = (ev) => { this.response = ev.detail; window.response = this.response; }
        this._routeRoutesHandler   = (ev) => this.addRoutes(ev.detail.routes);
        this._routeErrorHandler    = (ev) => this.showError(ev.detail);

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
            router.currentRoutes && this.addRoutes(router.currentRoutes);
            router.currentError && this.showError(router.currentError);
        }
    }

    connectedCallback() {
        if (this.router === undefined) this.setRouter(this.getAttribute("router"));
        let router = this.router;
        if (router) {
            // router events
            router.addEventListener("request", (ev) => {
                this.showLoading(ev.detail);
            });
            router.addEventListener("routes", (ev) => {
                this.addRoutes(ev.detail.routes);
            });
            router.addEventListener("error", (ev) => {
                this.showError(ev.detail);
            });

            // set current state
            router.currentRequest && this.showLoading(router.currentRequest);
            router.currentRoutes && this.addRoutes(router.currentRoutes);
            router.currentError && this.showError(router.currentError);
        }
    }

    _findNodeByRoute(route) {

    }

    _findRouteByNode(node) {
        while (node && node.getAttribute) {
            let uid = node.getAttribute("data-route");  // fails if node = shadowRoot
            if (uid) return this._routeLookup[uid];
            node = node.parentNode;
        }
    }

    showResponse(routes, status) {
        render(ROUTES(routes), this._root);
    }

    showLoading(request) {
        render(LOADING(request), this._root);
    }

    showError(error) {
        render(ERROR(error), this._root);
    }

    // DATA api
    clearRoutes() {
        console.warn("NOT IMPLEMENTED: clearRoutes()");
    }

    /**
     * adds routes to show.
     * @param {Array<Route>} routes
     */
    addRoutes(routes) {
        this._routes = routes;
        this._routeLookup = {};
        for (let route of routes) this._routeLookup[route.uid] = route;
        this.dispatchEvent(new CustomEvent('routes', { detail: { routes: routes, status: {}, }}));
        this.showResponse(routes, {});
    }

    toggleSelectRoute(route) {
        this._selectedRoute == route ? this.unselectRoute(route) : this.selectRoute(route);
    }

    /**
     * select route.
     * @param {Route} route - route to be selected
     * @param {boolean} exclusive - if true other selected routes will be unselected
     */
    selectRoute(route, exclusive=true) {
        if (this._selectedRoute) {
            this._emitRouteStyle(this._selectedRoute);
        }
        this._selectedRoute = route;
        this._emitRouteStyle(this._selectedRoute, "selected");
    }

    /**
     * unselect route.
     * @param {Route} route - route to be unselected
     */
    unselectRoute(route) {
        if (route && this._selectedRoute == route) {
            this._selectedRoute = undefined;
            this._emitRouteStyle(route);
        }
    }

    highlightRoute(route) {
        this._emitRouteStyle(route, this._selectedRoute == route && "selected", "highlighted");
    }

    unhighlightRoute(route) {
        this._emitRouteStyle(route, route == this._selectedRoute && "selected");
    }

    _emitRouteStyle(route, ...styles) {
        let allStyles = {};
        allStyles[route.uid] = styles.filter((style) => style);
        this.dispatchEvent(new CustomEvent('styles', { detail: allStyles }));
    }
}


const MARKUP = () => html`
        <style>
            :host {
                border: 2px solid blue;
                display: block;
            }
            :host .route {
                border-top: 1px solid #999;
                padding: 8px 8px 12px 8px;
                position: relative;
            }
            :host .route:hover {
                background: #DDD;
                cursor: pointer;
            }
            :host .leg {
                padding: 2px 3px;
                border: 1px solid #555;
                border-radius: 2px;
                margin: 0 2px 0 0;
                font-size: .7em;
                font-weight: bold;
            }
            :host .provider {
                position: absolute;
                right:5px;
                bottom:2px;
                padding: 0px 3px;
                font-size: .65em;
                color: #000;
                background: rgba(128, 128, 128, .3);
            }
            :host .loading {
                background-color: rgba(192, 128, 96, .8);
            }
            :host .error {
                background-color: rgba(255, 0, 0, .8);
            }
        </style>
        <div></div>
    `;


const ROUTES = (routes) => html`
    ${routes.map(route => html`
    <div class="route" data-route="${route.uid}">
        ${route.departure.timeString} -&gt; ${route.arrival.timeString} (${route.duration})<br>
        <span>${route.legs.map(leg => html`<span class="leg leg-${leg.transport.type}" title="${leg.summary || ''}" style="background-color: ${leg.transport.color};">${leg.transport.name}</span>`)}</span>
        <span class="provider">${route.router.name}</span>
    </div>
    `)}
    `;

const ERROR = (error) => html`
    <div class="error">${error}</div>
    `;

const LOADING = (request) => html`
    <div class="loading">loading <span class="loc">${request.start.name}</span> -&gt; <span class="loc">${request.dest.name}</span></div>
    `;


customElements.define("route-selector", RouteSelector);


export { RouteSelector }





class SampleElement extends HTMLElement {
    _rootTemplate(response, itemTemplate) { return html`
    <style>
      :host {
        display: block;
      }

      @media only screen and (-webkit-max-device-pixel-ratio: 1) {
        :host {
          will-change: transform;
        }
      }

      #routes {
        @apply --iron-list-items-container;
        position: relative;
      }

      :host(:not([grid])) #routes > ::slotted(*) {
        width: 100%;
      }

      #items > ::slotted(*) {
        box-sizing: border-box;
        margin: 0;
        position: absolute;
        top: 0;
        will-change: transform;
      }



            :host .route {
                @apply --iron-list-items-container;
                border-bottom: 1px solid #999;
                padding: 8px 8px 8px 8px;
                position: relative;
                display: block;
            }
            :host .route:hover {
                background: #DDD;
                cursor: pointer;
            }
            :host .legs {
            }
            :host .leg {
                padding: 2px 3px;
                border: 1px solid #555;
                border-radius: 2px;
                margin: 0 2px 0 0;
                font-size: .7em;
                font-weight: bold;
            }
            :host .leg:hover {
                border-color: #000;
            }
            :host .provider {
                position: absolute;
                right:5px;
                bottom:2px;
                padding: 3px 5px;
                font-size: .65em;
                line-height: 1em;
                color: #000;
                background: rgba(128, 128, 128, .3);
            }
            :host .loading {
                background-color: rgba(192, 128, 96, .8);
            }
            :host .error {
                background-color: rgba(255, 0, 0, .8);
            }
    </style>

    <array-2-selector id="selector" items="{ {items} }" selected="{ {selectedItems} }" selected-item="{ {selectedItem} }"></array-2-selector>

    <div id="routes">
        ${repeat(response.routes || [], (route) => route.id, (route, index) => itemTemplate(route))}
    </div>
    `; }

    constructor() {
        super();

        // prepare templates
        // +native this._rootTemplate
        this._itemTemplate = elementTemplate(this.querySelector("template"), ["route", (route) => route]);

        // prepare root
        this.attachShadow({mode: 'open'});
        this.clearRoutes();
//        this._listParent = this.shadowRoot.querySelector("div");

//        render(this.itemTemplate("foo", this), this._listParent);
//        render(this.itemTemplate("bar", this), this._listParent);
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
        render(this._rootTemplate({}, this._itemTemplate), this.shadowRoot);
    }

    addRoutes(routes) {
        console.warn("NOT IMPLEMENTED");
    }

    showResponse(response) {
        render(this._rootTemplate(response, this._itemTemplate), this.shadowRoot);
    }

    showLoading(request) {
        clearRoutes();
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
            router.currentRoutes && this.addRoutes(router.currentRoutes);
            router.currentError && this.showError(router.currentError);
        }
    }

}


/**
 * Extracts a template content from {DOMNode} specified via {DOMSelector}
 */
function elementTemplate(node, ...fields) {
    let as = node.getAttribute("as") || "data";
    let markup = node.innerHTML.trim()  // .content.firstElementChild.innerHTML.trim()
        .replace("=&gt;", "=>");
    node.parentNode.removeChild(node);
    let fn = Function.apply(null, ["html", as].concat(fields.map(([name, lookup]) => name)).concat([`return html\`${markup}\`;`]));
//    console.log(fn);
    return (...args) => fn(html, args[0], ...fields.map(([name, lookup]) => lookup(...args)));
}


customElements.define('route-selector-2', SampleElement);
