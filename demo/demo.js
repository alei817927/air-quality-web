
function initDemoMap(){

    var Esri_WorldImagery = L.tileLayer('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        attribution: 'Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
        subdomains: ["1", "2", "3", "4"]
    });

    var Esri_DarkGreyCanvas = L.tileLayer(
        "http://{s}.sm.mapstack.stamen.com/" +
        "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
        "{z}/{x}/{y}.png",
        {
            attribution: 'Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, '
        }
    );

    var wmsLayer  = L.tileLayer.wms('http://geo.u396.com:58091/geoserver/wms?', {
        layers: 'makenv:test'
    });

    var baseLayers = {
        "Satellite": Esri_WorldImagery,
        "wmsLayer": wmsLayer,
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