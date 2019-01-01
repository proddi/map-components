import {html, render} from 'https://unpkg.com/lit-html?module';


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

        this._routes = [];
        this._error = undefined;
        this._selectedRoute = undefined;
        this._highlightedRoutes = [];

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
   * register routes when element is used
   * @private
   */
    connectedCallback() {
        let router = document.querySelector(this.getAttribute("router"));
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
        this.router = router;
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
        <span>${route.legs.map(leg => html`<span class="leg leg-${leg.transport.type}" style="background-color: ${leg.transport.color};">${leg.transport.name}</span>`)}</span>
        <span class="provider">${route.router.type}</span>
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
