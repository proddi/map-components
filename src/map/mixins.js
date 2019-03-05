import {BaseRouter, RouteResponse, findRootElement} from '../generics.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';
import {RouteRequestEvent} from '../mc/events.js';


/**
 * @interface
 * @deprecated Use {@link RouteObserver} instead (implements selected as well).
 */
class SelectedMixin {
    /** @private */
    constructor() {
        /**
         * The source of selection. Will be set automatically when attribute `selector="#dom-selector"` is specified.
         * @type {SelectorMixin|null}
         * @listens {selector#items} - bar
         * @listens {selected} - foo
         * @listens {deselected} - foo foo
         */
        this.selector = null;
        console.warn("Using SelectedMixin() is deprecated - use RouteObserver() instead.");
    }
    /**
     * Updates the {@link SelectorMixin} to watch.
     * @param {SelectorMixin|DOMSelector} selector - The new selector to be watched.
     * @returns {SelectorMixin|null} - The old selector.
     */
    setSelector(selector) {}

    /**
     * Callback called when a new set of items is active.
     * @param {Array<*>} items - List of new items.
     * @param {...*} data - Additional data.
     */

    onItems(items, ...data) {}
    /**
     * Callback called when an item gets selected. The item is part of previously announced items in `onItems`.
     * @param {*} selected - The selected item.
     */

    onSelected(selected) {}
    /**
     * Callback called when the current selected item lost it's selection. The item is part of previously announced items in `onItems`.
     * @param {*} selected - The current selected item to be unselected.
     */
    onDeselected(selected) {}

    /**
     * Callback when an item gets emphasized.
     * @param {*} item - The related item.
     * @param {string|null} accent - An accent as identificator.
     * @param {boolean} isSelected - True when the relatd item is currently selected.
     */
    onEmphasizedItem(item, accent, isSelected) {}
}

/**
 * Mixin to watch a {@link SelectorMixin}.
 * @private
 */
let SelectedMixinImpl = Base => class extends Base {
    constructor() {
        super();
        this._itemsHandler      = (ev) => {
            this.onItems(ev.detail[0], ...ev.detail[1])
            };
        this._selectedHandler   = (ev) => this.onItemSelected(ev.detail);
        this._deselectedHandler = (ev) => this.onItemDeselected(ev.detail);
        this._emphasizedHandler = (ev) => this.onEmphasizedItem(ev.detail.item, ev.detail.accent, ev.detail.isSelected);

        this.selector = null;
        whenElementReady(qs(this.getAttribute("router")) || qp(this, "[role=router]"))
            .then(selector => this.setSelector(selector))
            .catch(err => console.error(this, "Unable to attache to selector:", err))
            ;
    }

//    connectedCallback() {
//        super.connectedCallback && super.connectedCallback();
//    }

    /**
     * sets a new selector source
     * @param {BaseSelector|DOMSelector} selector - The new selector source
     */
    setSelector(selector) {
        let oldSelector = this.selector;
        // ensure a BaseRouter instance
        if (!(selector instanceof HTMLElement)) selector = document.querySelector(selector);

        // unregister events @old selector
        if (this.selector) {
            this.selector.removeEventListener("items", this._itemsHandler);
            this.selector.removeEventListener("selected", this._selectedHandler);
            this.selector.removeEventListener("unselected", this._deselectedHandler);
            this.selector.removeEventListener("emphasize-item", this._emphasizedHandler);
            this.selector.selectedItem && this._deselectedHandler({ detail: this.selector.selectedItem });
        }

        this.selector = selector;

        // register events @new selector
        if (this.selector) {
            this.selector.addEventListener("items", this._itemsHandler);
            this.selector.addEventListener("selected", this._selectedHandler);
            this.selector.addEventListener("unselected", this._deselectedHandler);
            this.selector.addEventListener("emphasize-item", this._emphasizedHandler);
            if (this.selector.hasOwnProperty("items")) {
                setTimeout(_ => {
                    this._itemsHandler({ detail: this.selector.items });
                    this.selector.selectedItem && this._selectedHandler({ detail: this.selector.selectedItem });
                });
            }
        }

        return oldSelector;
    }

    /**
     * @abstract
     */
    onItems(items, ...data) {}

    /**
     * @abstract
     */
    onItemSelected(item) {}

    /**
     * @abstract
     */
    onItemDeselected(item) {}

    /**
     * @abstract
     */
    onEmphasizedItem(item, accent, isSelected) {}
};


/**
 * @interface
 * @deprecated Use {@link RouteSource} instead (implements select as well).
 * @emits {items} - Fired when a new set of items is available.
 * @emits {selected} - Fired when an item gets selected.
 * @emits {deselect} - Fired when the selected item lost it's selection.
 * @emits {emphasize-item} - Fired when an item gets a special accent.
 */
class SelectorMixin {
    /** @private */
    constructor() {
        /**
         * The selected item or null
         * @type {*|null}
         */
        this.selectedItem = null;
        /**
         * Defines th behavior of selectItem()
         * @type {boolean}
         */
        this.toggleSelection = false;
        /**
         * The available items.
         * @type {Array<*>}
         */
        this.items = [[], []];

        console.warn("Using SelectorMixin() is deprecated - use RouteSource() instead.");
    }
    /**
     * @param {Array<*>} items - The available items.
     * @param {...*} data - Additional optional data.
     */
    setItems(items, ...data) {}

    clearItems() {}

    /**
     * Selects the given item, it toggles selection when {@link SelectorMixin#toggleSelection} (attribute `toggle`) is true.
     * @param {*} item
     */
    selectItem(item) {}

    deselectItem(item=null) {}

    /**
     * Marks the item
     */
    emphasizeItem(item, accent=null) {}
}


/**
 * Mixin to be watched by a {@link SelectedMixin} interface.
 * @interface
 * @type {Class}
 */
let SelectorMixinImpl = Base => class extends Base {
    /** @private */
    constructor() {
        super();
        this.items = [[], []];
        this.selected = null;
        this.selectedItem = null;
        this.toggleSelection = false;
    }

    connectedCallback() {
        this.toggleSelection = this.hasAttribute("toggle");
        super.connectedCallback && super.connectedCallback();
    }

    setItems(items, ...data) {
        this.deselectItem();
        this.items = [items, data];
        this.dispatchEvent(new CustomEvent('items', { detail: this.items }));
    }

    clearItems() {
        this.setItems([]);
    }

    selectItem(selected) {
        if (selected !== this.selectedItem) {
            this.deselectItem(this.selectedItem);
            this.selectedItem = this.selected = selected;
            this.dispatchEvent(new CustomEvent('selected', { detail: this.selectedItem }));
        } else {
            if (this.toggleSelection) this.deselectItem(selected);
        }
    }

    deselectItem(selected=null) {
        if (this.selectedItem) {
            this.dispatchEvent(new CustomEvent('unselected', { detail: this.selectedItem }));
            this.selectedItem = this.selected = null;
        }
    }

    emphasizeItem(item, accent=null) {
        this.dispatchEvent(new CustomEvent('emphasize-item', { detail: {
                item: item,
                accent: accent,
                isSelected: item === this.selectedItem,
            }}));
    }
};


/**
 * This mixin allows an easy subscribe to an Router component.
 * @deprecated Use {@link RouteObserver} instead.
 * @interface
 * @listens {BaseRouter#request} - When a new request is initiated.
 * @listens {BaseRouter#response} - When a new response is available.
 */
class RouterMixin {
    /** @protected */
    constructor() {
        /**
         * The connected router. Will be set automatically when attribute `router="#dom-selector"` is specified.
         * @listens {route-request} Observe when new route request is initiated.
         * @listens {route-response} Observe when new route response is available.
         * @type {BaseRouter|null}
         */
        this.router = null;

        console.warn("Usage of RouterMixin() is deprecated - use RouteObserver() instead.");
    }

    /** @protected */
    connectedCallback() {}

    /**
     * Sets a new router source.
     * @param {BaseRouter|DOMSelector|null} router - The new routes source
     * @return {BaseRouter|null} - The previous router instance.
     */
    setRouter(router) {}

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
     * @param {RouteRequest} request
     */
    onRouteRequest(request) {}

    /**
     * Callback when new response is available.
     * @param {RouteResponse} response
     */
    onRouteResponse(response) {}

    /**
     * Callback when the current request have a intermediate response is available.
     * @param {RouteResponse} response
     */
    onIntermediateRouteResponse(response) {}

    /**
     * Callback when the response has an error.
     * @deprecated
     */
    onResponseError(error) {}

    /**
     * Callback when the response has routes.
     * @deprecated
     */
    onRoutes(routes) {}
}


// real implementation, no doc
let RouterMixinImpl = Base => class extends Base {
    constructor() {
        super();

        this._routeRequestHandler              = (ev) => this.onRouteRequest(ev.detail);
        this._routeResponseHandler             = (ev) => this.onRouteResponse(ev.detail);
        this._intermediateRouteResponseHandler = (ev) => this.onIntermediateRouteResponse(ev.detail);

        this.router = null;
        whenElementReady(qs(this.getAttribute("router")) || qp(this, "[role=router]") || qs("[role=router]"))
            .then(router => this.setRouter(router))
            .catch(err => console.error("Unable to attach <router>:", err))
            ;
    }

    setRouter(router) {
        let oldRouter = this.router;

        // ensure a BaseRouter instance
        if (!(router instanceof HTMLElement)) router = document.querySelector(router);

        // unregister events @old router
        if (this.router) {
            this.router.removeEventListener("request", this._routeRequestHandler);
            this.router.removeEventListener("response", this._routeResponseHandler);
            this.router.removeEventListener("route-response-intermediate", this._intermediateRouteResponseHandler);
            this._routeRequestHandler({});
            this._routeResponseHandler({});
        }

        this.router = router;

        // register events @new router
        if (this.router) {
            this.router.addEventListener("request", this._routeRequestHandler);
            this.router.addEventListener("response", this._routeResponseHandler);
            this.router.addEventListener("route-response-intermediate", this._intermediateRouteResponseHandler);
            router.routeResponse && this._routeResponseHandler({ detail:router.routeResponse });
        }

        if (super.setRouter) throw "Whoopsie";
        return oldRouter;
    }

    getRouteRequest() { return this.router && this.router.routeRequest; }

    getRouteResponse() { return this.router && this.router.routeResponse; }

    onRouteRequest(request) {}

    onRouteResponse(response) {}

    onIntermediateRouteResponse(response) {}




    /**
     * @deprecated
     * @abstract
     */
    onResponseError(error) {}

    /**
     * @deprecated
     * @abstract
     */
    onRoutes(routes) {}
};


/**
 * This mixin implements a routing functionality using an external `router` component. The state of the used router will
 * not be changed.
 *
 * @deprecated Use {@link RouteObserver} instead.
 *
 * @interface
 * @emits {request} - Fired when a new request is initiated. It can be used t erase previous routes.
 * @emits {route-response-intermediate} - Fired when an intermediate route response is available. "Intermediate" means
 *                                        a response with an incomplete set of routes.
 * @emits {route} - Fired when an response is available. This response is final.
 */
class SetRouteMixin {
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
        /**
         * The connected router. Will be set automatically when attribute `router="#dom-selector"` is specified.
         * @type {BaseRouter|null}
         */
        this.router;

        console.warn("Using SetRouteMixin() is deprecated - use RouteObserver instead.");
    }
    initRoute() {}
    setRoute(start, dest, time=null) {}
    setRouteRequest(request) {}
    setRouteResponse(response) {}
}


let SetRouteMixinImpl = Base => class extends Base {
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
         * The connected router. Will be set automatically when attribute `router="#dom-selector"` is specified.
         * @type {BaseRouter|null}
         */
        this.router = null;
        whenElementReady(qs(this.getAttribute("router")) || qp(this, "[role=router]") || qs("[role=router]"))
            .then(router => {
                console.assert(router instanceof BaseRouter);
                this.router = router;
                this.initRoute();
                if (this.start && this.dest) {
                    this.setRoute(this.start, this.dest, this.time);
                }
            })
            .catch(err => console.error("Unable to attach <router>:", err))
            ;
    }

    initRoute() {
        /** @type {Address|null} */
        this.start  = this.getAttribute("start");
        /** @type {Address|null} */
        this.dest   = this.getAttribute("dest");
        /** @type {Date|null} */
        this.time   = this.getAttribute("time");
    }

    setRoute(start, dest, time=null) {
        this.start = start;
        this.dest = dest;
        this.time = time === undefined ? this.time : time;
        if (this.router && this.start && this.dest) {
            let request = this.router.buildRouteRequest(this.start, this.dest, this.time);
            this.setRouteRequest(request);
            let progress = (response) => this.setRouteResponse(response, true);
            (request.error ? Promise.reject(request.error) : request.router.execRouteRequest(request, progress))
                .catch(error => new RouteResponse(request).fail(error))
                .then(response => this.setRouteResponse(response));
            return request;
        }
    }

    setRouteRequest(request) {
        this.routeRequest = request;
        this.routeResponse = null;
        this.dispatchEvent(new CustomEvent('request', { detail: request }));
    }

    setRouteResponse(response, intermediate=false) {
        this.routeResponse = response;
        let eventName = intermediate ? 'route-response-intermediate' : 'response';
        this.dispatchEvent(new CustomEvent(eventName, { detail: response }));
    }
}





































import { RouteSource, RouteObserver } from '../mc/mixins.js';

console.warn('RouteSource() and RouteObserver() moved from "./map/mixins.js" to "./mc/mxins.js"');


export {
    SelectorMixinImpl as SelectorMixin, SelectedMixinImpl as SelectedMixin,
    RouterMixinImpl as RouterMixin,
    RouterMixinImpl as OnRouteMixin,
    SetRouteMixinImpl as SetRouteMixin,

    RouteSource, RouteObserver,
}
