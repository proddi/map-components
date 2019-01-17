"use strict";
import {loadScript, parseString} from '../generics.js';


// singleton: load here-maps javascript resources
const hereResources = loadScript(
            "https://js.api.here.com/v3/3.0/mapsjs-core.js"
    ).then(_ => {
        return loadScript(
            "https://js.api.here.com/v3/3.0/mapsjs-mapevents.js",
            "https://js.api.here.com/v3/3.0/mapsjs-service.js",
            "https://js.api.here.com/v3/3.0/mapsjs-ui.js"
        );
    });


/**
 * The platform element is required to handle credentials for HERE services.
 *
 * _Hint: To have a working map you'll have to provide the attributes `app_id="..."` and `app_code="..."`._
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 * </here-map>
 *
 * @see https://developer.here.com/documentation/maps/
 **/
class HerePlatform extends HTMLElement {
    constructor() {
        super();

        this.app_id   = parseString(this.getAttribute("app-id"), window);
        this.app_code = parseString(this.getAttribute("app-code"), window);

        /** @type {Promise<{platform:H.service.Platform, maptypes:object}>} */
        this.whenReady = hereResources.then(_ => {
            let platform = new H.service.Platform({
                useCIT: true,
                useHTTPS: true,
                app_id: this.app_id,
                app_code: this.app_code,
            });
            let maptypes = platform.createDefaultLayers();
            return Promise.resolve({ platform: platform, maptypes: maptypes });
        });
    }
}


customElements.define("here-platform", HerePlatform);


export { HerePlatform }
