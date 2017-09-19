var Esri_WorldImagery = L.tileLayer.grayscale('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
  attribution: '',
  subdomains: ["1", "2", "3", "4"]
});

var map = L.map('map', {
  layers: [Esri_WorldImagery],
  minZoom: 3,
  maxZoom: 16,
  zoomControl: false,
  noWrap: true,
  maxBounds: [[84.67351256610522, -174.0234375], [-58.995311187950925, 223.2421875]]
});
map.attributionControl.setPrefix(false);

map.setView([34.53, 104.7], µ.isMobile() ? 3 : 5);

////////////////
function buildData(response) {
  var dataView = new DataView(response);
  var data = {header: {}, data: []};
  var keys = ["nx", "ny", "lo1", "la1", "lo2", "la2", "dx", "dy", "parameterCategory", "parameterNumber"];
  var index = 0;
  for (var i = 0; i < keys.length; i++, index += 4) {
    data.header[keys[i]] = dataView.getFloat32(index, false);
  }
  for (var i = 0; index < dataView.byteLength; index += 4, i++) {
    data.data[i] = dataView.getFloat32(index, false);
  }
  return data;
}

function requestWind() {
  var counter = 0;
  var uData = null, vData = null;

  function checkAndCombineData() {
    if (uData !== null && vData !== null) {
      var data = [uData, vData];
      L.windOverlay(data, {}).addTo(map);
    }
  }

  µ.getBinary('/backup/demo/data/f000-wind.json.w-u.bin', function (response) {
    uData = buildData(response);
    checkAndCombineData();
  });
  µ.getBinary('/backup/demo/data/f000-wind.json.w-v.bin', function (response) {
    vData = buildData(response);
    checkAndCombineData();
  });
}
function requestTemp() {
  µ.getBinary('/backup/demo/data/f000-temp.json.temp.bin', function (response) {
    var data = buildData(response);
    L.distributionOverlay({opacity: 0.5}, data).addTo(map);
  });
}
requestWind();
requestTemp();