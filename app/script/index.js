function initMap() {
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

  µ.location(map, function (map) {
    map.setView([34.53, 104.7], µ.isMobile() ? 3 : 5);
  });
  return map;
}

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

var windLayer = null, bgLayer = null;
var resourcePath = '/backup/demo/data/';

function requestWind(map, time) {
  var counter = 0;
  var uData = null, vData = null;

  function checkAndCombineData() {
    if (uData !== null && vData !== null) {
      var data = [uData, vData];
      if (windLayer === null) {
        windLayer = L.windOverlay(data, {}).addTo(map);
      } else {
        windLayer.setData(data);
      }
    }
  }

  µ.getBinary(resourcePath + time + '.wu', function (response) {
    uData = buildData(response);
    checkAndCombineData();
  });
  µ.getBinary(resourcePath + time + '.wv', function (response) {
    vData = buildData(response);
    checkAndCombineData();
  });
}

function requestTemp(map, time, product, type) {
  µ.getBinary(resourcePath + time + '.' + type, function (response) {
    var data = buildData(response);
    if (bgLayer === null) {
      bgLayer = L.distributionOverlay({opacity: 1}, product, data).addTo(map);
    } else {
      bgLayer.setData(data);
    }
  });
}

var cb = null;

function resize() {
  if (µ.isMobile()) {
    var v = document.body.clientWidth;
    v = v - 20;
    $('.box').width(v);
    $('.progressTime').width(v - 36);
    $('#content').width(v);
  }
  var cw = $('#content').width() - 12;
  $('#cbc').width(cw);
  var cbc = document.getElementById("cbc");
  cbc.width = cw;
  if (cb !== null) cb.draw();
}

var tl;
$(document).ready(function (e) {
  resize();
  var map = initMap();

  var type = 'TEMP';

  var product = products.productsFor(type);

  cb = colorbar('cbc');
  cb.draw(CONFIG.WEATHER.TEMP.colors);
  µ.mapControl(map, 'timeline', 'bottomleft');
  µ.mapControl(map, 'aqcontrol', 'topleft');
  // $(":radio").labelauty();
  $(".to-labelauty").labelauty({minimum_width: "35px"});
  // $(".to-labelauty-icon").labelauty({ label: false });
  var startTime = "2017/09/10 0:00:00", endTime = "2017/09/15 0:00:00";
  tl = new timeline();
  tl.init(startTime, endTime, function (time) {
    time = time === undefined ? '2017091102' : time;
    requestWind(map, time);
    requestTemp(map, time, product, type);

  });
  // SetProgressTime(null, "2017/07/29 0:00:00", "2017/08/03 0:00:00");
});
$(window).resize(function () {
  resize();
});

$(document).mouseup(function (e) {
  var target = $(e.target);
  if (!target.is("#content") && target.parents("#content").length === 0) {
    $("#content").hide("fast", function () {
      $("#fonts").show();
    });
  }
});
$("#fonts").on('click', function (e) {
  $("#fonts").hide();
  $("#content").show("fast");
});
