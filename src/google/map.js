"use strict";
import {parseCoordString, findRootElement, deferredPromise} from '../generics.js';
import {GooglePlatform} from './platform.js';


/**
 * Shows a Google map. This is the base canvas for other visualisation elements.
 * It requires a {@link GooglePlatform} component to handle credentials.
 *
 * @example
 * <google-platform key="..."></google-platform>
 *
 * <google-map platform="google-platform" center="13.5,52.5" zoom="11">
 * </google-map>
 *
 * @see https://developers.google.com/maps/documentation/javascript/
 **/
class GoogleMap extends HTMLElement {

    constructor() {
        super();
        this._ensureBaseStyles();
        this.center = parseCoordString(this.getAttribute("center"));
        this.zoom = parseInt(this.getAttribute("zoom"));
        /** @type {GooglePlatform} */
        this.platform = findRootElement(this, this.getAttribute("platform"), GooglePlatform);
        /** @type {Promise<{map:google.maps.Map}|Error>} */
        this.whenReady = deferredPromise();
    }

    connectedCallback() {
        this.platform.whenReady.then(_ => {
            let map = new google.maps.Map(this, {
              center: this.center,
              zoom: this.zoom,
            });

            this.whenReady.resolve({map:map});
        }).catch(error => this.whenReady.reject(error));
    }

    _ensureBaseStyles() {
        GoogleMap.prototype._ensureBaseStyles = () => {};
        let style = document.createElement('style');
        style.textContent=`google-map { display: block; }`;
        document.head.appendChild(style);
    }
}


/**
 * @external {google.maps.Map} https://developers.google.com/maps/documentation/javascript/reference/map
 */


customElements.define("google-map", GoogleMap);


export { GoogleMap }
