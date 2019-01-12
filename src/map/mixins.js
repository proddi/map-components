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
}

/**
 * Mixin to watch a {@link SelectorMixin}.
 * @private
 */
let SelectedMixinImpl = Base => class extends Base {
    constructor() {
        super();
        this._itemsHandler      = (ev) => this.onItems(ev.detail);
        this._selectedHandler   = (ev) => this.onSelected(ev.detail);
        this._unselectedHandler = (ev) => this.onUnselected(ev.detail);
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        this.selector = this.setSelector(this.getAttribute("selector"));
    }

    /**
     * sets a new selector source
     * @param {BaseSelector|DOMSelector} selector - The new selector source
     */
    setSelector(selector) {
        // ensure a BaseRouter instance
        if (!(selector instanceof HTMLElement)) selector = document.querySelector(selector);

        // unregister events @old selector
        if (this.selector) {
            this.selector.removeEventListener("items", this._itemsHandler);
            this.selector.removeEventListener("selected", this._selectedHandler);
            this.selector.removeEventListener("unselected", this._unselectedHandler);
            this.selector.selected && this._unselectedHandler({ detail: this.selector.selected });
        }

        this.selector = selector;

        // register events @new selector
        if (this.selector) {
            this.selector.addEventListener("items", this._itemsHandler);
            this.selector.addEventListener("selected", this._selectedHandler);
            this.selector.addEventListener("unselected", this._unselectedHandler);
            this._itemsHandler({ detail: this.selector.items });
            this.selector.selected && this._selectedHandler({ detail: this.selector.selected });
        }

        return this.selector;
    }

    /**
     * @abstract
     */
    onItems(items) {
//        console.warn("onItems() not implemented", this);
    }

    /**
     * @abstract
     */
    onSelected(selected) {
//        console.warn("onSelected() not implemented", this);
    }

    /**
     * @abstract
     */
    onUnselected(selected) {
//        console.warn("onUnselected() not implemented", this);
    }

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
         * The selected item or undefined
         * @type {*|null}
         */
        this.selected = undefined;
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
     */
    select(selected) {}
    unselect(selected) {}
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
        this.selected = null;
    }

    setItems(items) {
        this.items = items || [];
        this.dispatchEvent(new CustomEvent('items', { detail: this.items }));
    }

    clearItems() {
        this.setItems([]);
    }

    select(selected) {
        if (selected !== this.selected) {
            this.unselect();
            this.selected = selected;
            this.dispatchEvent(new CustomEvent('selected', { detail: this.selected }));
        }
    }

    unselect(selected=null) {
        if (this.selected) {
            this.dispatchEvent(new CustomEvent('unselected', { detail: this.selected }));
            this.selected = null;
        }
    }

    toggleSelect(selected) {
        this.selected === selected ? this.unselect(selected) : this.select(selected);
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
     * @param {Request} request
     */
    onRequest(request) {}

    /**
     * Callback when new response is available.
     * @param {Response} response
     */
    onResponse(response) {}

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

        this._requestHandler  = (ev) => this.onRequest(ev.detail);
        this._responseHandler = (ev) => this.onResponse(ev.detail);
    }

    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        if (this.router === undefined) this.setRouter(this.getAttribute("router"));
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
            this.router.removeEventListener("request", this._requestHandler);
            this.router.removeEventListener("response", this._responseHandler);
//            this.router.removeEventListener("routes", this._routeRoutesHandler);
//            this.router.removeEventListener("error", this._routeErrorHandler);
            this._requestHandler({});
            this._responseHandler({});
        }

        this.router = router;

        // register events @new router
        if (this.router) {
            this.router.addEventListener("request", this._requestHandler);
            this.router.addEventListener("response", this._responseHandler);
//            this.router.addEventListener("routes", this._routeRoutesHandler);
//            this.router.addEventListener("error", this._routeErrorHandler);
        // set current state
//          this.showLoading(router.currentRequest);
            router.response && this._responseHandler({ detail:router.response });
//            router.currentRoutes && this.addRoutes(router.currentRoutes);
//            router.currentError && this.showError(router.currentError);
        }

        return this.router;
    }

    /**
     * @abstract
     */
    onRequest(request) {
//        console.warn("onRequest() isn't implemented", this);
    }

    /**
     * @abstract
     */
    onResponse(response) {
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
