import {findRootElement} from '../generics.js';


/**
 * Adds start+stop map-marker to map and bind them to the router. When markers dragged the router gets updated.
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 * <router id="router"></router>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 *   <here-map-route-picker router="#router"></here-map-route-picker>
 * </here-map>
 **/
class HereMapRoutePicker extends HTMLElement {
    constructor() {
        super();
        let mapComp = findRootElement(this, this.getAttribute("map"), customElements.get("here-map"));
        let router = document.querySelector(this.getAttribute("router"));

        mapComp.whenReady.then(({map, behavior}) => {

            let startMarker = new H.map.Marker({lat:0,lng:0}, {icon:new H.map.Icon(TRIP_START_SVG, {anchor: new H.math.Point(30, 53)})});//, {icon: new H.map.DomIcon(`<div class="svg-icon start-icon"></div>`)});
            startMarker.draggable = true;
            let destMarker = new H.map.Marker({lat:0,lng:0}, {icon:new H.map.Icon(TRIP_DEST_SVG, {anchor: new H.math.Point(36, 63)})});//, {icon: new H.map.DomIcon(`<div class="svg-icon start-icon"></div>`)});
            destMarker.draggable = true;

            function _dragStartHandler() {
                behavior.disable();
            }

            function _dragEndHandler(ev) {
                let target = ev.target,
                    data = target.getData(),
                    position = target.getPosition();
                behavior.enable();
                router.update(startMarker.getPosition(), destMarker.getPosition());
            }

            function _dragHandler(ev) {
                let marker = ev.target,
                    pointer = ev.currentPointer,
                    newPosition = map.screenToGeo(pointer.viewportX, pointer.viewportY);
                marker.setPosition(newPosition);
            }

            let draggableLayer = new H.map.Group();
            draggableLayer.addEventListener("dragstart", _dragStartHandler, true);
            draggableLayer.addEventListener("drag", _dragHandler, true);
            draggableLayer.addEventListener("dragend", _dragEndHandler, true);
            draggableLayer.addObjects([startMarker, destMarker]);
            map.addObject(draggableLayer);

            // Router
            router.addEventListener("request", ev => {
                let request = ev.detail;
                startMarker.setPosition(request.start);
                destMarker.setPosition(request.dest);
                map.setViewBounds(draggableLayer.getBounds());
            });
            if (router.currentRequest) {
                startMarker.setPosition(router.currentRequest.start);
                destMarker.setPosition(router.currentRequest.dest);
                map.setViewBounds(draggableLayer.getBounds());
            }
        });
    }
}


const TRIP_START_SVG = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     width="63px" height="65px" viewBox="0 0 63 65" enable-background="new 0 0 63 65" xml:space="preserve">
<g opacity="0.3">
    <g>
        <defs>
            <rect id="SVGID_1_" x="15" y="7.498" width="34" height="51.996"/>
        </defs>
        <clipPath id="SVGID_2_">
            <use xlink:href="#SVGID_1_"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#SVGID_2_)" fill="#0D2E41" d="M49,7.498H20c-2.757,0-5,2.243-5,5v24c0,2.757,2.243,5,5,5h15.938
            l-3.996,11.997c-3.287,0.016-5.944,1.352-5.944,2.999c0,1.657,2.687,3,6,3s6-1.343,6-3c0-0.946-0.878-1.788-2.247-2.339L49,40.908
            V7.498z"/>
    </g>
</g>
<polygon fill="#00A3F2" points="31.997,56.494 46.502,41.979 35.893,44.802 "/>
<polygon fill="#1B7BA3" points="37.325,40.498 35.891,44.802 46.502,41.979 47.983,40.498 "/>
<path fill="#00A3F2" d="M48,40.498v-32H20c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4H48z"/>
</svg>`;

const TRIP_DEST_SVG = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     width="73.119px" height="82.604px" viewBox="0 0 73.119 82.604" enable-background="new 0 0 73.119 82.604" xml:space="preserve">
<g opacity="0.3">
    <g>
        <defs>
            <rect id="SVGID_1_" x="20" y="15.304" width="34" height="51.996"/>
        </defs>
        <clipPath id="SVGID_2_">
            <use xlink:href="#SVGID_1_"  overflow="visible"/>
        </clipPath>
        <path clip-path="url(#SVGID_2_)" fill="#0D2E41" d="M54,15.304H25c-2.757,0-5,2.243-5,5v24c0,2.757,2.243,5,5,5h15.938
            l-3.996,11.997c-3.287,0.016-5.944,1.352-5.944,2.999c0,1.657,2.687,3,6,3s6-1.343,6-3c0-0.946-0.878-1.788-2.247-2.339L54,48.714
            V15.304z"/>
    </g>
</g>
<polygon fill="#FFFFFF" points="36.997,64.3 51.502,49.785 40.892,52.608 "/>
<polygon fill="#999999" points="42.325,48.304 40.891,52.608 51.502,49.785 52.983,48.304 "/>
<rect x="29" y="16.306" fill="#020C1F" width="8" height="8"/>
<rect x="37" y="16.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="45" y="16.306" fill="#020C1F" width="8" height="8"/>
<rect x="21" y="24.306" fill="#020C1F" width="8" height="8"/>
<rect x="29" y="24.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="37" y="24.306" fill="#020C1F" width="8" height="8"/>
<rect x="45" y="24.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="21" y="32.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="29" y="32.306" fill="#020C1F" width="8" height="8"/>
<rect x="37" y="32.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="45" y="32.306" fill="#020C1F" width="8" height="8"/>
<rect x="29" y="40.306" fill="#FFFFFF" width="8" height="8"/>
<rect x="37" y="40.306" fill="#020C1F" width="8" height="8"/>
<rect x="45" y="40.306" fill="#FFFFFF" width="8" height="8"/>
<path fill="#020C1F" d="M29,40.306h-8v3.998c0,2.194,1.79,4.002,3.98,4.002H29V40.306z"/>
<path fill="#FFFFFF" d="M29,16.306h-4c-2.2,0-4,1.798-4,3.998v4.002h8V16.306z"/>
</svg>`;


customElements.define("here-map-route-picker", HereMapRoutePicker);


export { HereMapRoutePicker }
