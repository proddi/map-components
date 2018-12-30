import {loadScript, loadStyle} from '../generics.js';


// singleton: load mapbox javascript resources
let _resources = {};
/**
 * Load mapbox resources
 * @param {string} token - mapbox access token
 * @return {Promise<{L:L}>}
 */

function loadResources(token) {
    if (_resources[token]) return _resources[token];

    return _resources[token] = Promise.all([
        loadScript("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.js"),
        loadStyle("https://api.mapbox.com/mapbox.js/v3.1.1/mapbox.css")
    ]).then(_ => {
        L.mapbox.accessToken = token;
        return {L:L};
    });
}


// singleton: load mapbox javascript resources
let _resources3d = {}
/**
 * Load mapboxgl resources
 * @param {string} token - mapbox access token
 * @return {Promise<{L:L, mapboxgl:mapboxgl}>}
 */
function loadResources3d(token) {
    if (_resources3d[token]) return _resources3d[token];

    return _resources3d[token] = Promise.all([
        loadResources(token),
        loadScript("https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.js"),
        loadStyle("https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.css")
    ]).then(([{L},,]) => {
        mapboxgl.accessToken = token;
        return {L:L, mapboxgl:mapboxgl};
    })
}


export { loadResources, loadResources3d }
