
function initDemoMap(){

    var Esri_WorldImagery = L.tileLayer('http://geo.u396.com:58091/geoserver/gwc/service/wmts/{z}/{y}/{x}.jpg', {
        attribution: 'Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
    });

    var Esri_DarkGreyCanvas = L.tileLayer(
        "http://{s}.sm.mapstack.stamen.com/" +
        "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
        "{z}/{x}/{y}.png",
        {
            attribution: 'Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, '
        }
    );

    var baseLayers = {
        "Satellite": Esri_WorldImagery,
        "Grey Canvas": Esri_DarkGreyCanvas
    };

    var map = L.map('map', {
        layers: [ Esri_WorldImagery ]
    });

    var layerControl = L.control.layers(baseLayers);
    layerControl.addTo(map);
    map.setView([50.00, 14.44], 3);

    return {
        map: map,
        layerControl: layerControl
    };
}

// demo map
var mapStuff = initDemoMap();
var map = mapStuff.map;
var layerControl = mapStuff.layerControl;
var handleError = function(err){
    console.log('handleError...');
    console.log(err);
};

WindJSLeaflet.init({
	localMode: true,
	map: map,
	layerControl: layerControl,
	useNearest: false,
	timeISO: null,
	nearestDaysLimit: 7,
	displayValues: true,
	displayOptions: {
		displayPosition: 'bottomleft',
		displayEmptyString: 'No wind data'
	},
	overlayName: 'wind',

	// https://github.com/danwild/wind-js-server
	pingUrl: 'http://localhost:7000/alive',
	latestUrl: 'http://localhost:7000/latest',
	nearestUrl: 'http://localhost:7000/nearest',
	errorCallback: handleError
});