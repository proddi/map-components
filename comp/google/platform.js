import {loadScript, parseString} from '../generics.js';


/**
 * The platform element is required to handle credentials for GOOGLE services.
 *
 * @example
 * <google-platform key="..."></google-platform>
 *
 * <google-router platform="google-platform"
 *      start="lat,lon"
 *      dest="lat,lon">
 * </google-router>
 *
 **/
class GooglePlatform extends HTMLElement {
    constructor() {
        super();

        /** @type {Promise<{service:google.maps.DirectionsService}>} */
        this.whenReady = loadScript(
                "https://maps.googleapis.com/maps/api/js?key=" + parseString(this.getAttribute("key"), window)
            ).then(_ => {
                return Promise.resolve({ service: new google.maps.DirectionsService() });
            });
    }
}


customElements.define("google-platform", GooglePlatform);


export { GooglePlatform }
