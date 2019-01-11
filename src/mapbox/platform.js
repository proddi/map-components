import {loadScript, loadStyle, parseString} from '../generics.js';


// singleton: load mapbox javascript resources
const resources = Promise.all([
    loadScript("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.js"),
    loadStyle("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.css")
]);

/**
 * The platform element is required to handle credentials for HERE services.
 *
 * @example
 * <mapbox-platform token="..."></mapbox-platform>
 *
 * <mapbox-map platform="mapbox-platform" center="13.5,52.5" zoom="11">
 * </mapbox-map>
 *
 * @see https://www.mapbox.com/mapbox.js/api/v3.1.1/
 **/
class MapboxPlatform extends HTMLElement {
    constructor() {
        super();

        /** @type {Promise<{L:L}|Error>} */
        this.whenReady = resources.then(_ => {
                L.mapbox.accessToken = parseString(this.getAttribute("token"), window);
                return {L:L};
            });
    }
}


/**
 * @external {L} https://www.mapbox.com/mapbox.js/api/v3.1.1/
 */


customElements.define("mapbox-platform", MapboxPlatform);


export { MapboxPlatform }
