import {qs, qp, whenElementReady} from './utils.js';


/**
 * This mixin implements a routing functionality using an external `router` component. The state of the used router will
 * not be changed.
 *
 * @interface
 * @emits {RouteRequestEvent} route-request - Fired when a new request is initiated. The structure is: `{ request: {@link RouteRequest} }`.
 * @emits {CustomEvent} route-response - Fired when an route response is available. The structure is: `{ response: {@link RouteResponse}, intermediate: {@link boolean} }`. The property "intermediate" indicates a final Response will come later.
 * @emits {CustomEvent} route-clear - Fired when a response gets cleared. The structure is: `{ }`.
 * @emits {CustomEvent} route-selected - Fired when a route gets selected. The structure is: `{ route: {@link Route} }`.
 * @emits {CustomEvent} route-deselected - Fired when a route gets deselected. The structure is: `{ route: {@link Route} }`.
 * @emits {CustomEvent} route-emphasized - Fired when a route gets makred with an accent. The structure is: `{ route: {@link Route}, accent: {*} }`.
 */
class RouteSource {
    constructor() {
        /** @type {Address|null} */
        this.start = null;
        /** @type {Address|null} */
        this.dest = null;
        /** @type {Date|null} */
        this.time = null;

        /**
         * The current route request.
         * @type {RouteRequest|null}
         */
        this.routeRequest = null;
        /**
         * The current route response.
         * @type {RouteResponse|null}
         */
        this.routeResponse = null;
    }
//    initRoute() {}
//    setRoute(start, dest, time=null) {}

    /**
     * Indicating a new {@link Request} is initiated. It also emits a `route-request` event with `{ request: Request }`
     * as payload.
     * @deprecated Override the "protected" method `_emitRouteRequest()`.
     * @param {Request} request
     */
    requestRoute(request) {}
    /**
     * Emits a {@link RouteRequestEvent} as `route-request`.
     * @protected
     * @fires {RouteRequestEvent} route-request
     * @param {RouteRequest} request
     */
    _emitRouteRequest(request) {}
    /**
     * Emits a {@link RouteResponseEvent} as `route-response`.
     * @param {Response} response
     * @param {boolean} [intermediate=false]
     */
    responseRoute(response, intermediate=false) {}
    /**
     * Emits a {@link RouteSelectedEvent} as `route-selected`.
     * @param {Route} route
     */
    selectRoute(route) {}
    /**
     * Emits a {@link RouteDeselectedEvent} as `route-deselected`.
     * @param {Route} route
     */
    deselectRoute(route) {}
    /**
     * Emits a {@link RouteEmphasizedEvent} as `route-emphasized`.
     * @param {Route} route
     * @param {*} accent
     */
    emphasizeRoute(route, accent=null) {}
}


let RouteSourceImpl = Base => class extends Base {
    constructor() {
        super();

        /**
         * The current route request.
         * @type {RouteRequest|null}
         */
        this.routeRequest = null;

        /**
         * The current route response.
         * @type {RouteResponse|null}
         */
        this.routeResponse = null;

        /**
         * @TODO: think about having { route: Route, leg: Leg, step: Step} as selection structure
         */
        this.routeSelected = null;

        setTimeout(_ => {
            this.initRoute();
            this.setRoute(this.start, this.dest, this.time);
        });
    }

    initRoute() {
        /** @type {Address|null} */
        this.start  = this.getAttribute("start");
        /** @type {Address|null} */
        this.dest   = this.getAttribute("dest");
        /** @type {Date|null} */
        this.time   = this.getAttribute("time");
    }

    // return myself
    getRouter() {
        return Promise.reject("Abstract: No router available");
    }

    setRoute(start, dest, time=null) {
        this.start = start;
        this.dest = dest;
        this.time = time === undefined ? this.time : time;
        if (this.start && this.dest) {
            this.getRouter().then(router => {
                    this.deselectRoute();
                    let request;
                    try {
                        request = router.buildRouteRequest(this.start, this.dest, this.time);
                    } catch (e) {
                        request = new RouteResponse(this, this.start, this.dest, this.time).fail(e);
                    }
                    this.requestRoute(request);
                    let progress = (response) => this.responseRoute(response, true);
                    return (request.error ? Promise.reject(request.error) : request.router.execRouteRequest(request, progress))
                        .catch(error => new RouteResponse(request).fail(error))
                        .then(response => this.responseRoute(response))
                        ;
                }, err => console.error("No router available:", err))  // failure? we don't care
                ;
        }
    }

    requestRoute(...args) {
        return this._emitRouteRequest(...args);
//        this.routeRequest = request;
//        this.routeResponse = null;
//        this.dispatchEvent(new CustomEvent('route-request', { detail: { request: request, }}));
    }

    _emitRouteRequest(request) {
        this.routeRequest = request;
        this.routeResponse = null;
        this.dispatchEvent(new CustomEvent('route-request', { detail: {
                request: request, source: this,
            }}));
    }

    responseRoute(response, intermediate=false) {
        this.routeResponse = response;
        this.routeResponseIsIntermediate = intermediate;
        this.dispatchEvent(new CustomEvent('route-response', { detail: {
                response: response,
                intermediate: intermediate,
                source: this,
            }}));
    }

    clearRoute() {
        this.deselectRoute();
        this.dispatchEvent(new CustomEvent('route-clear', { detail: { source: this, }}));
    }

    /**
     * Selects the given route, it toggles selection when {@link RouteSource#toggleSelection} (attribute `toggle`) is present.
     * @param {Route} route
     */
    selectRoute(route) {
        if (route !== this.routeSelected) {
            this.deselectRoute(this.routeSelected);
            this.routeSelected = route;
            this.dispatchEvent(new CustomEvent('route-selected', { detail: {
                    route: this.routeSelected,
                    source: this,
                }}));
        }
    }

    /**
     * Selects the given route, it toggles selection when {@link RouteSource#toggleSelection} (attribute `toggle`) is present.
     * @param {Route} route
     * /
    selectRouteLeg(route, leg) {
        if (leg !== this.routeLegSelected) {
            this.deselectRouteLeg(this.routeLegSelected);
            this.routeLegSelected = leg;
            this.dispatchEvent(new CustomEvent('route-leg-selected', { detail: {
                    route: this.routeSelected,
                    leg: this.routeLegSelected,
                    source: this,
                }}));
        }
    }

    /**
     * Indicates the route is not selected anymore.
     * @param {Route|null} [route=null] - The related route if multiselection is active.
     */
    deselectRoute(route=null) {
        if (this.routeSelected) {
            this.dispatchEvent(new CustomEvent('route-deselected', { detail: {
                    route: this.routeSelected,
                    source: this,
                }}));
            this.routeSelected = null;
        }
    }

    /**
     * Mark an route with an accent. This can be used for visual effects e.g. hover effects.
     * @param {Route} route
     * @param {*} [accent=null] - An accent for the route.
     */
    emphasizeRoute(route, accent=null) {
        this.dispatchEvent(new CustomEvent('route-emphasized', { detail: {
                route: route,
                accent: accent,
                isSelected: route === this.routeSelected,
                source: this,
            }}));
    }
}





/**
 * This mixin allows an easy subscribe to an RouteSource component.
 * @interface
 */
class RouteObserver {
    constructor() {
        /**
         * The connected router-source. The component looks automatically for the router-source when the attribute
         * `router-source="#dom-selector"` is specified or when the router-source has `role="router-source"`.
         * @type {RouteSource|null}
         */
        this.routeSource = null;
    }

    /**
     * Sets a new router source.
     * @todo Change to Promise (using whenElementReady) or accept no {@link DOMNode} anymore.
     * @param {RouteSource|DOMSelector|null} routeSource - The new router-source.
     * @return {RouteSource|null} - The previous router-source instance.
     */
    setRouteSource(routeSource) {}

    /**
     * Returns the current route request if available.
     * @return {RouteRequest|null}
     */
    getRouteRequest() {}

    /**
     * Returns the current route response if available.
     * @return {RouteResponse|null}
     */
    getRouteResponse() {}

    /**
     * Callback when new request is initiated.
     * @deprecated Override the "protected" method `_onRouteRequest()`.
     * @param {RouteRequest} request
     */
    onRouteRequest(request) {}

    /**
     * Event listener for router's `route-request` event.
     * @protected
     * @param {RouteRequest} request
     */
    _onRouteRequest(request) {}

    /**
     * Callback when new response is available.
     * @param {RouteResponse} response
     * @param {boolean} [intermediate=false] - Indicates an intermediate result.
     */
    onRouteResponse(response, intermediate=false) {}

    onRouteClear() {}

    onRouteSelected(route) {}

    onRouteDeselected(route) {}

    onRouteEmphasized(route, accent=null, isSelected) {}
}


// real implementation, no doc
let RouteObserverImpl = Base => class extends Base {
    constructor() {
        super();

        this._routeRequestHandler              = (ev) => this.onRouteRequest(ev.detail.request, ev.detail.source);
        this._routeResponseHandler             = (ev) => this.onRouteResponse(ev.detail.response, ev.detail.intermediate, ev.detail.source);
        this._routeClearHandler                = (ev) => this.onRouteClear(ev.detail.source);
        this._routeSelectedHandler             = (ev) => this.onRouteSelected(ev.detail.route);
        this._routeDeselectedHandler           = (ev) => this.onRouteDeselected(ev.detail.route);
        this._routeEmphasizedHandler           = (ev) => this.onRouteEmphasized(ev.detail.route, ev.detail.accent, ev.detail.isSelected);

        this.routeSource = null;
        whenElementReady(qs(this.getAttribute("route-source")) || qp(this, "[role=route-source]"))
            .then(routeSource => this.setRouteSource(routeSource))
            .catch(err => console.error(this, "Unable to attach to a <route-source>:", err))
            ;
    }

    setRouteSource(routeSource) {
        let oldRouteSource = this.routeSource;

        // ensure a BaseRoute instance
        if (!(routeSource instanceof HTMLElement)) routeSource = document.querySelector(routeSource);

        // unregister events @old routeSource
        if (this.routeSource) {
            this.routeSource.removeEventListener("route-request", this._routeRequestHandler);
            this.routeSource.removeEventListener("route-response", this._routeResponseHandler);
            this.routeSource.removeEventListener("route-clear", this._routeClearHandler);
            this.routeSource.removeEventListener("route-selected", this._routeSelectedHandler);
            this.routeSource.removeEventListener("route-deselected", this._routeDeselectedHandler);
            this.routeSource.removeEventListener("route-emphasized", this._routeEmphasizedHandler);
            this._routeClearHandler();
        }

        this.routeSource = routeSource;

        // register events @new routeSource
        if (this.routeSource) {
            this.routeSource.addEventListener("route-request", this._routeRequestHandler);
            this.routeSource.addEventListener("route-response", this._routeResponseHandler);
            this.routeSource.addEventListener("route-clear", this._routeClearHandler);
            this.routeSource.addEventListener("route-selected", this._routeSelectedHandler);
            this.routeSource.addEventListener("route-deselected", this._routeDeselectedHandler);
            this.routeSource.addEventListener("route-emphasized", this._routeEmphasizedHandler);

            if (this.routeSource.routeRequest) {
//                setTimeout(_ => {
                    this._routeRequestHandler({ detail: { source: this.routeSource, request: this.routeSource.routeRequest, }});
                    this.routeSource.routeResponse && this._routeResponseHandler({ detail: { source: this.routeSource, response: this.routeSource.routeResponse, intermediate: this.routeSource.routeResponseIsIntermediate, }});
                    this.routeSource.routeSelected && this._routeSelectedHandler({ detail: { source: this.routeSource, route: this.routeSource.routeSelected, }});
//                });
            }
        }

        if (super.setRouteSource) throw "Whoopsie, @dev ... fix this...";
        return oldRouteSource;
    }

//    getRouteRequest() { return this.router && this.router.routeRequest; }

//    getRouteResponse() { return this.router && this.router.routeResponse; }

    onRouteRequest(request) {}

    onRouteResponse(response, intermediate, source) {}

    onRouteClear() {}

    onRouteSelected(route) {}

    onRouteDeselected(route) {}

    onRouteEmphasized(route, accent=null, isSelected) {}
};


export {
    RouteSourceImpl as RouteSource,
    RouteObserverImpl as RouteObserver,
}
