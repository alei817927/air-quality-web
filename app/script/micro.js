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
    var points = [], interpolators = [], ranges = [];
    for (var i = 0; i < segments.length - 1; i++) {
      points.push(segments[i + 1][0]);
      interpolators.push(colorInterpolator(segments[i][1], segments[i + 1][1]));
      ranges.push([segments[i][0], segments[i + 1][0]]);
    }

    return function (point, alpha) {
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

  return {
    isMobile: isMobile,
    isValue: isValue,
    floorMod: floorMod,
    segmentedColorScale: segmentedColorScale,
    clearCanvas: clearCanvas,
    proportion: proportion,
    clamp: clamp,
    getJSON: getJSON,
    getBinary: getBinary
  };
}();