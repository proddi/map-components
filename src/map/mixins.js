import {Response} from '../generics.js';


/**
 * @interface
 */
class SelectedMixin {
    /** @private */
    constructor() {
        /**
         * The source of selection. Will be set automatically when attribute `selector="#dom-selector"` is specified.
         * @type {SelectorMixin}
         */
        this.selector = undefined;
    }
    /**
     * Updates the {@link SelectorMixin} to watch.
     * @param {SelectorMixin|DOMSelector} selector
     */
    setSelector(selector) {}

    onItems(items) {}
    onSelected(selected) {}
    onUnselected(selected) {}

    onEmphasizedItem(item, accent, isSelected) {}

}

/**
 * Mixin to watch a {@link SelectorMixin}.
 * @private
 */
let SelectedMixinImpl = Base => class extends Base {
    constructor() {
        super();
        this._itemsHandler      = (ev) => this.onItems(ev.detail);
        this._selectedHandler   = (ev) => this.onItemSelected(ev.detail);
        this._deselectedHandler = (ev) => this.onItemDeselected(ev.detail);
        this._emphasizedHandler = (ev) => this.onEmphasizedItem(ev.detail.item, ev.detail.accent, ev.detail.isSelected);
    }

    connectedCallback() {
        this.setSelector(this.getAttribute("selector"));
        super.connectedCallback && super.connectedCallback();
    }

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
                this._itemsHandler({ detail: this.selector.items });
                this.selector.selectedItem && this._selectedHandler({ detail: this.selector.selectedItem });
            }
        }

        return oldSelector;
    }

    /**
     * @abstract
     */
    onItems(items) {}

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
 * @emits {SelectorMixin#selected} when an item gets selected.
 * @emits {SelectorMixin#unselected} when an item gets unselected.
 */
class SelectorMixin {
    /** @private */
    constructor() {
        /**
         * The selected item or null
         * @type {*|null}
         */
        this.selected = null;
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
        this.items = [];
    }
    /**
     * @param {Array<*>} items - The available items.
     */
    setItems(items) {}

    clearItems() {}

    /**
     * @param {*} selected - The selected data
     * @deprecated
     */
    select(selected) {}

    /**
     * Selects the given item, it toggles selection when `toggle` is true.
     * @param {*} item
     */
    selectItem(item) {}

    /** @deprecated */
    unselect(selected) {}
    deselectItem(item=null) {}

    /** @deprecated */
    toggleSelect(item) {}

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
        this.items = [];
        this.selected = null;
        this.selectedItem = null;
        this.toggleSelection = false;
    }

    connectedCallback() {
        this.toggleSelection = this.hasAttribute("toggle");
        super.connectedCallback && super.connectedCallback();
    }

    setItems(items) {
        this.deselectItem();
        this.items = items || [];
        this.dispatchEvent(new CustomEvent('items', { detail: this.items }));
    }

    clearItems() {
        this.setItems([]);
    }

    select(selected) {
        return this.selectItem(selected);
    }

    selectItem(selected) {
        if (selected !== this.selectedItem) {
            this.unselect();
            this.selectedItem = this.selected = selected;
            this.dispatchEvent(new CustomEvent('selected', { detail: this.selectedItem }));
        } else {
            if (this.toggleSelection) this.deselectItem(selected);
        }
    }

    unselect(selected=null) {
        return this.deselectItem(selected);
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
 * @interface
 * @listens {BaseRouter#request} - When a new request is initiated.
 * @listens {BaseRouter#response} - When a new response is available.
 */
class RouterMixin {
    /** @private */
    constructor() {
        /**
         * The connected router. Will be set automatically when attribute `router="#dom-selector"` is specified.
         * @type {BaseRouter|undefined}
         */
        this.router = undefined;
    }

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
     * Callback when the response has an error.
     */
    onResponseError(error) {}

    /**
     * Callback when the response has routes.
     */
    onRoutes(routes) {}
}


// real implementation, no doc
let RouterMixinImpl = Base => class extends Base {
    /** @private */
    constructor() {
        super();
        this.router = undefined;

        this._routeRequestHandler  = (ev) => this.onRouteRequest(ev.detail);
        this._routeResponseHandler = (ev) => this.onRouteResponse(ev.detail);
    }

    connectedCallback() {
        if (this.router === undefined) this.setRouter(this.getAttribute("router"));
        super.connectedCallback && super.connectedCallback();
    }

    /**
     * sets a new router source
     * @param {BaseRouter|DOMSelector} router - The new routes source
     */
    setRouter(router) {
        // ensure a BaseRouter instance
        if (!(router instanceof HTMLElement)) router = document.querySelector(router);

        // unregister events @old router
        if (this.router) {
            this.router.removeEventListener("request", this._routeRequestHandler);
            this.router.removeEventListener("response", this._routeResponseHandler);
            this._routeRequestHandler({});
            this._routeResponseHandler({});
        }

        this.router = router;

        // register events @new router
        if (this.router) {
            this.router.addEventListener("request", this._routeRequestHandler);
            this.router.addEventListener("response", this._routeResponseHandler);
            router.routeResponse && this._routeResponseHandler({ detail:router.routeResponse });
        }

        return this.router;
    }

    /**
     * @abstract
     */
    onRouteRequest(request) {
//        console.warn("onRequest() isn't implemented", this);
    }

    /**
     * @abstract
     */
    onRouteResponse(response) {
//        console.warn("onResponse() isn't implemented", this);
    }

    /**
     * @abstract
     */
    onResponseError(error) {
//        console.warn("onResponseError() isn't implemented", this);
    }

    /**
     * @abstract
     */
    onRoutes(routes) {
//        console.warn("onRoutes() isn't implemented", this);
    }
};


export {SelectorMixinImpl as SelectorMixin, SelectedMixinImpl as SelectedMixin, RouterMixinImpl as RouterMixin}
