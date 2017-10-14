var µ = function () {
  "use strict";

  function floorMod(a, n) {
    var f = a - n * Math.floor(a / n);
    return f === n ? 0 : f;
  }

  function isValue(x) {
    return x !== null && x !== undefined;
  }


  //----start
  function colorInterpolator(start, end) {
    var r = start[0], g = start[1], b = start[2];
    var Δr = end[0] - r, Δg = end[1] - g, Δb = end[2] - b;
    return function (i, a) {
      return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
    };
  }

  function segmentedColorScale(segments) {
    // console.log(segments, '---')
    var points = [], interpolators = [], ranges = [];
    for (var i = 0; i < segments.length - 1; i++) {
      points.push(segments[i + 1][0]);
      interpolators.push(colorInterpolator(segments[i][1], segments[i + 1][1]));
      ranges.push([segments[i][0], segments[i + 1][0]]);
    }

    return function (point, alpha) {
      // console.log(points, 'vvvvvvvvvvvvvv')
      var i;
      for (i = 0; i < points.length - 1; i++) {
        if (point <= points[i]) {
          break;
        }
      }
      var range = ranges[i];
      return interpolators[i](µ.proportion(point, range[0], range[1]), alpha);
    };
  }

  //----end
  //----start
  function clamp(x, low, high) {
    return Math.max(low, Math.min(x, high));
  }

  function proportion(x, low, high) {
    return (µ.clamp(x, low, high) - low) / (high - low);
  }

  //----end
  function clearCanvas(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
   */
  function isMobile() {
    return (/android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(navigator.userAgent));
  }


  function ajax(url, callback, responseType) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = responseType === undefined ? 'text' : responseType;
    xhr.onload = function (e) {
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        callback(this.response);
      }
    };
    xhr.send();
  }

  function getJSON(url, callback) {
    ajax(url, callback, 'json');
  }

  function getBinary(url, callback) {
    ajax(url, callback, 'arraybuffer');

  }

  function mapControl(mapObj, id, position) {
    var container = L.DomUtil.get(id);
    var ControlLayer = L.Control.extend({
      options: {
        position: position
      },
      initialize: function (options) {
        L.setOptions(this, options);
      },
      onAdd: function (map) {
        return container;
      }
    });
    var cl = new ControlLayer().addTo(mapObj);
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(container, 'mousewheel', L.DomEvent.stopPropagation);
    return cl;
  }

  function location(map, onerr) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        map.setView([lat, lon], µ.isMobile() ? 5 : 7);
      }, function (error) {
        console.error("浏览器不支持地理定位。", error);
        onerr(map);
      }, {
        enableHighAccuracy: true,
        timeout: 1000,
        maximumAge: 0
      });
    }
  }

  function round(value, fixed) {
    var m = Math.pow(10, fixed);
    return Math.round(value * m) / m;
  }

  function formatYYYYmmddHH(time) {
    var year = time.getFullYear();
    var month = time.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    var currDate = (time.getDate() < 10 ? '0' : '') + time.getDate();
    var hours = (time.getHours() < 10 ? '0' : '') + time.getHours();
    return year + '' + month + currDate + hours;
  }

  function buildWeatherData(originData) {
    var dataView = new DataView(originData);
    var data = {header: {}, data: []};
    var keys = ['nx', 'ny', 'lo1', 'la1', 'lo2', 'la2', 'dx', 'dy', 'parameterCategory', 'parameterNumber'];
    var index = 0;
    for (var i = 0; i < keys.length; i++, index += 4) {
      data.header[keys[i]] = dataView.getFloat32(index, false);
    }
    for (var i = 0; index < dataView.byteLength; index += 4, i++) {
      data.data[i] = dataView.getFloat32(index, false);
    }
    return data;
  }

  function buildAqData(originData) {
    var dataView = new DataView(originData);
    var keys = ['x0', 'y0', 'xcell', 'ycell', 'row', 'col', 'x1', 'y1', 'xcent', 'ycent', 'palp', 'pbet'];
    var index = 0;
    var data = {header: {}, data: []};
    for (var i = 0; i < keys.length; i++, index += 4) {
      data.header[keys[i]] = dataView.getFloat32(index, false);
    }
    for (var i = 0; index < dataView.byteLength; index += 4, i++) {
      data.data[i] = dataView.getFloat32(index, false);
    }
    return data;

  }
  function buildLambertData(originData) {
    var dataView = new DataView(originData);
    var keys = ['x0', 'y0', 'xcell', 'ycell', 'row', 'col', 'x1', 'y1', 'xcent', 'ycent', 'palp', 'pbet'];
    var index = 0;
    var header = {};
    for (var i = 0; i < keys.length; i++, index += 4) {
      header[keys[i]] = dataView.getFloat32(index, false);
    }
    var data = {header: {}, data: []};
    var projsrc = '+proj=lcc +lat_1=20 +lat_2=50 +lat_0=35 +lon_0=110 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
    var projdst = 'EPSG:4326';
    // var transform = proj4(projsrc, projdst);
    var transform = proj4(projsrc);
    var ll0 = transform.inverse([header.x0, header.y0]);
    var ll1 = transform.inverse([header.x1, header.y1]);
    data.header.lo1 = ll0[0];
    data.header.la1 = ll0[1];
    data.header.lo2 = ll1[0];
    data.header.la2 = ll1[1];
    data.header.ny = header.row;
    data.header.nx = header.col;
    data.header.dx = (data.header.lo2 - data.header.lo1) / header.col;
    data.header.dy = (data.header.la1-data.header.la2) / header.row;
    console.log(header)
    console.log(data.header)
    console.log(ll0,ll1,'----')
    for (var i = 0; index < dataView.byteLength; index += 4, i++) {
      data.data[i] = dataView.getFloat32(index, false);
    }
    return data;
  }

  return {
    isMobile: isMobile,
    isValue: isValue,
    floorMod: floorMod,
    segmentedColorScale: segmentedColorScale,
    clearCanvas: clearCanvas,
    proportion: proportion,
    clamp: clamp,
    getJSON: getJSON,
    getBinary: getBinary,
    mapControl: mapControl,
    location: location,
    round: round,
    formatYYYYmmddHH: formatYYYYmmddHH,
    buildWeatherData: buildWeatherData,
    buildAqData: buildAqData
  };
}();