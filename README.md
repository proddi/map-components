MAPS Web Components
===================

This is a prototype to use maps out there in an easy and declarative way.

Examples are located in _examples/_ folder.



Concepts
--------

- normalized `Maps`, `Router`, `Search` from different providers (Google, HERE, MapBox).
- declarative compositing of scenarios.

Support:
--------

- Google: routing
- HERE: Map, Transit routing, Route picking, Route rendering
- MapBox: Map, Route picking, Route rendering


Example
=======

A fully functional map with transit route and drag'n'drop markers to change the route.

    <body>
        <here-platform id="here-platform" app-id="${HERE_APP_ID}" app-code="${HERE_APP_CODE}"></here-platform>

        <here-transit-router id="here-router"
            app-id="${HERE_APP_ID}"
            app-code="${HERE_APP_CODE}"
            start="13.40,52.53"
            dest="13.56,52.41"
            time="2018-12-22T19:17:07">
        </here-transit-router>

        <here-map center="13.5,52.5" zoom="11" style="height:500px" platform="#here-platform">
            <!-- picker is the input tool -->
            <here-map-route-picker id="picker" router="#here-router"></here-map-route-picker>
            <!-- visualize router's routes -->
            <here-map-routes router="#here-router" styles="#picker"></here-map-routes>
        </here-map>

        <div style="position:fixed;right:0;top:0;width:300px;background:rgba(255,255,255,.8)">
            <route-selector id="route-selector" router="#here-router"></route-selector>
        </div>
    </body>


Usage
=====

Build the build:

_not yet implemented_ (What is a good packaging? Webpack?)

Build docs:

    make docs

Clean workspace:

    make clean
