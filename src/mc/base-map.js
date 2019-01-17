"use strict";

import {parseCoordString, findRootElement} from '../generics.js';


/**
 * Abstract Map Component to have common integration features (e.g. History)
 *
 * @abstract
 */
class BaseMap extends HTMLElement {
    constructor() {
        super();
        /**
         * Holds the {@link History} instance if present
         * @type {History}
         */
        this.history = null;

        this.center = parseCoordString(this.getAttribute("center"));
        this.zoom = this.getAttribute("zoom");
    }

    /**
     * Provides a default implementation of the standard Custom Elements connectedCallback.

     * The default implementation enables the property effects system and flushes any pending properties, and updates shimmed CSS properties when using the ShadyCSS scoping/custom properties polyfill.
     */
    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        this.history = document.querySelector(this.getAttribute("history") || 'mc-history');
    }
}


export {BaseMap}
