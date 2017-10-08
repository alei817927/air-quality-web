var map;
var tl, currentTime;

var PRODUCT_TYPE_WEATHER = 'weather', PRODUCT_TYPE_AQ = 'aq';

function initMap() {
  var Esri_WorldImagery = L.tileLayer.grayscale('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    attribution: '',
    subdomains: ["1", "2", "3", "4"]
  });

  map = L.map('map', {
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
  // return map;
}


var windLayer = null, bgLayer = null;
var bgData = null, uData = null, vData = null;

function checkAndProcessPopup() {
  if (bgData !== null && uData !== null && vData !== null) {
    refreshPopup();
    uData = null;
    vData = null;
    bgData = null;
    if (autoPlayFun !== undefined) {
      autoPlayFun();
      autoPlayFun = undefined;
    }
  }
}

function requestWind(map, time) {
  function checkAndCombineData() {
    if (uData !== null && vData !== null) {
      var data = [uData, vData];
      if (windLayer === null) {
        windLayer = L.windOverlay(data, {}).addTo(map);
      } else {
        windLayer.setData(data);
        console.log('checkAndCombineData');
      }
      checkAndProcessPopup();
    }
  }

  var _resourcePath = processResourcePath('TEMP');

  µ.getBinary(_resourcePath + time + '.WU', function (response) {
    uData = µ.buildWeatherData(response);
    checkAndCombineData();
  });
  µ.getBinary(_resourcePath + time + '.WV', function (response) {
    vData = µ.buildWeatherData(response);
    checkAndCombineData();
  });
}

function requestBackgroundData(map, time, product, type) {
  var _resourcePath = processResourcePath(type);
  µ.getBinary(_resourcePath + time + '.' + type, function (response) {
    var productType = CONFIG.PRODUCTS[type].type;
    if (productType === PRODUCT_TYPE_AQ) {
      bgData = µ.buildAqData(response);
    } else if (productType === PRODUCT_TYPE_WEATHER) {
      bgData = µ.buildWeatherData(response);
    }
    if (bgLayer === null) {
      bgLayer = L.distributionOverlay({opacity: 1}, product, bgData).addTo(map);
    } else {
      bgLayer.setData(product, bgData);
    }
    checkAndProcessPopup();
  });
}

var cb = null;

function resize() {
  if (µ.isMobile()) {
    var v = document.body.clientWidth;
    v = v - 10;
    $('.box').width(v);
    $('.progressTime').width(v - 36);
    $('#content').width(v - 10);
  }
  var cw = $('#content').width() - 2;
  $('#cbc').width(cw);
  var cbc = document.getElementById("cbc");
  cbc.width = cw;
  if (cb !== null) cb.draw(CONFIG.PRODUCTS[selectedProduct]);
}


function initOptions() {
  var _products = {};
  for (var key in CONFIG.PRODUCTS) {
    var v = CONFIG.PRODUCTS[key];
    if (_products[v['type']] === undefined) {
      _products[v['type']] = '';
    }
    v.key = key;
    v.product = products.productsFor(key);
    _products[v['type']] += '<input class="to-labelauty synch-icon" type="radio" name="rd1" data-labelauty="' + v.name + '" product="' + key + '"' + (CONFIG.selected === key ? ' checked' : '') + '/>';
  }
  $('#' + PRODUCT_TYPE_WEATHER).html(_products[PRODUCT_TYPE_WEATHER]);
  $('#' + PRODUCT_TYPE_AQ).html(_products[PRODUCT_TYPE_AQ]);
}

var startTime = "2017/09/10 0:00:00", endTime = "2017/09/15 0:00:00";
var days = 0, interval = 0, refTime, timeIndex = 0, selectedProduct;
var autoPlayFun;
$(document).ready(function (e) {
  initOptions();
  initMap();
  selectedProduct = CONFIG.selected;
  var product = CONFIG.PRODUCTS[selectedProduct].product;
  // $(".to-labelauty-icon").labelauty({ label: false });
  $.getJSON(resourcePath + 'meta.json', function (response) {
    cb = colorbar('cbc');
    cb.draw(CONFIG.PRODUCTS[selectedProduct]);
    µ.mapControl(map, 'timeline', 'bottomleft');
    µ.mapControl(map, 'aqcontrol', 'topleft');
    // $(":radio").labelauty();
    $(".to-labelauty").labelauty({minimum_width: "35px"});
    // resourcePath += response.latest + '/';
    days = response.days;
    interval = response.intervalHour;
    refTime = response.refTime;
    parseTime(refTime, interval, days);
    tl = new timeline();
    tl.init(startTime, endTime, function (time, index, autoPlay) {
      currentTime = time === undefined ? '2017091102' : µ.formatYYYYmmddHH(time);
      autoPlayFun = autoPlay;
      var tagggg = false;
      if (needRequestData(index)) {
        var _currentTime = processRequestTime(index);
        requestWind(map, _currentTime);
        tagggg = true;
      }
      if (needRequestData(index, selectedProduct)) {
        var _currentTime = processRequestTime(index, selectedProduct);
        requestBackgroundData(map, _currentTime, product, selectedProduct);
        tagggg = true;
      }
      timeIndex = index;
      if (!tagggg && autoPlayFun !== undefined) {
        autoPlayFun();
        autoPlayFun = undefined;
      }
    });
    $("input[name=rd1]").click(function (event) {
      var type = event.target.attributes.product.value;
      var product = CONFIG.PRODUCTS[type];
      if (needRequestData(timeIndex)) {
        var _currentTime = processRequestTime(timeIndex);
        requestWind(map, _currentTime);
      }
      if (needRequestData(timeIndex, type)) {
        var _currentTime = processRequestTime(timeIndex, type);
        requestBackgroundData(map, _currentTime, product.product, type);
      }
      selectedProduct = type;
      $('#fonts p').html(product.name);
      $('#cbc-title').html(product.name + '（' + product.unit + '）');
      cb.draw(CONFIG.PRODUCTS[type]);
    });
  });
  resize();
  map.on('click', mouseClick);
});
var popup, markerPos;

function mouseClick(e) {
  if ($('#content').css('display') === 'block') return;
  markerPos = e.latlng;
  if (popup !== undefined) {
    map.removeLayer(popup);
  }
  var htmlOut = buildPopupContent();
  // marker = L.marker(markerPos).addTo(map).bindPopup(htmlOut).openPopup();
  popup = L.popup()
    .setLatLng(markerPos)
    .setContent(htmlOut)
    .addTo(map);
  // popup.openPopup();
}

function refreshPopup() {
  if (popup === undefined) return;
  var content = buildPopupContent();
  popup.setContent(content);
  popup.update();
}

function buildPopupContent() {
  var product = CONFIG.PRODUCTS[selectedProduct];
  if (windLayer === null || bgLayer === null) {
    return null;
  }
  var gridValue = windLayer.interpolate(markerPos.lng, markerPos.lat);
  var vMs = gridValue[1];
  vMs = vMs > 0 ? vMs = vMs - vMs * 2 : Math.abs(vMs);
  var windDegree = windLayer.vectorToDegrees(gridValue[0], vMs);
  var windRate = windLayer.vectorToSpeed(gridValue[0], vMs);
  var productGridValue = bgLayer.interpolate(markerPos.lng, markerPos.lat);
  if (selectedProduct === 'TEMP') {
    productGridValue -= 273.15;
  }
  return "<strong>风向：</strong>" + µ.round(windDegree, 2) + "°"
    + "<br /> <strong>风速：</strong>" + µ.round(windRate, 2) + " 米/秒"
    + "<br />  <strong>" + product.name + "：</strong>" + µ.round(productGridValue, 2) + ' ' + product.unit;
}

function processResourcePath(productType) {
  return resourcePath + productType + '/';
}

function processRequestTime(index, productKey) {
  index = index === undefined ? 0 : index;
  var v1 = Math.floor(index / interval);
  if (selectedProduct === productKey || productKey === undefined) {
    var v2 = Math.floor(timeIndex / interval);
    if (v1 === v2) {
      return currentTime;
    }
  }
  var time = new Date();
  var addOn = refTime + v1 * interval * 3600000;
  // console.log(refTime, v1, interval, addOn,productKey)
  time.setTime(addOn);
  return µ.formatYYYYmmddHH(time);
}

function needRequestData(index, productKey) {
  // console.log(selectedProduct, productKey, timeIndex, index)
  // index = index === undefined ? 0 : index;
  timeIndex = timeIndex === undefined ? 0 : timeIndex;
  if (selectedProduct === productKey && timeIndex === index) {
    return false;
  }
  var _product = productKey === undefined ? CONFIG.PRODUCTS.TEMP : CONFIG.PRODUCTS[productKey];
  if (_product.type === PRODUCT_TYPE_WEATHER && (selectedProduct === productKey || productKey === undefined)) {
    return index === undefined || (Math.floor(timeIndex / interval) !== Math.floor(index / interval) || index % interval === 0);
  }
  return true;
}

function parseTime(time, interval, days) {
  var date = new Date();
  date.setTime(time);
  startTime = date.toString();
  time += days * 86400000;
  date.setTime(time);
  endTime = date.toString();
  // console.log(days, interval)
}

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
