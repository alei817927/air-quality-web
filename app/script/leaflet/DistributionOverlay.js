/**
 *     //A    R    G    B
 var colors = [
 [205, 20, 20, 240],
 [205, 20, 50, 230],
 [205, 20, 80, 220],
 [205, 20, 100, 210],
 [205, 20, 120, 200],
 [205, 20, 140, 190],
 [205, 20, 160, 180],
 [205, 20, 160, 140],
 [205, 80, 200, 70],
 [205, 150, 240, 70],
 [205, 240, 240, 40],
 [205, 240, 210, 40],
 [205, 240, 160, 40],
 [205, 240, 130, 40],
 [205, 240, 40, 40],
 [205, 240, 10, 40]
 ];
 * @type {void|*}
 */
L.DistributionOverlay = L.Layer.extend({
  options: {
    opacity: 1
  },
  initialize: function (options, product, data, colorKeys,type) {
    L.setOptions(this, options);
    this._product = product;
    this._productType = type;
    this._data = data;
    this._colorKeys = colorKeys;
  },
  onAdd: function (map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
    // this._canvas = document.createElement("canvas");;
    this._map._panes.overlayPane.appendChild(this._canvas);
    map.on('viewreset', this._reset, this);
    if (map.options.zoomAnimation && L.Browser.any3d) {
      // map.on('zoomanim', this._animateZoom, this);
      // map.on('move', this._adjustViewport, this);
      // map.on('zoomstart', this._adjustViewport, this);
      map.on('moveend', this._draw, this);
      // map.on('zoomend', this._adjustViewport, this);
    }
    // var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    // L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

    // console.log(product);
    this._builder = this._product.build(this._data,this._productType);
    this._draw();
    this._updateOpacity();
  },
  onRemove: function onRemove(map) {
  },
  _animateZoom: function () {
    // this._adjustViewport();
  },
  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },
  _buildColorIndex: function (value) {
    var left, maxIndex, right;
    left = 0;
    maxIndex = right = this._colorKeys.length - 1;
    while (left <= right) {
      var mid = parseInt((left + right) / 2);
      if (this._colorKeys[mid] >= value) {
        right = mid - 1;
      }
      else {
        left = mid + 1;
      }
    }
    return left > maxIndex ? maxIndex : left;
  },
  _reset: function () {
    this._draw();
  },
  _draw: function () {
    var self = this;
    setTimeout(function () {
      self._adjustViewport();
    });
  },
  _adjustViewport: function () {
    var canvas = this._canvas;
    var map = this._map;
    var topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    var size = map.getSize();
    var viewWidth = size.x, viewHeight = size.y;

    canvas.width = viewWidth;
    canvas.height = viewHeight;
    // canvas.style.width = viewWidth + 'px';
    // canvas.style.height = viewHeight + 'px';
    var ctx = canvas.getContext('2d');

    var OVERLAY_ALPHA = Math.floor(0.4 * 255);
    var imgData = ctx.createImageData(viewWidth, viewHeight);
    // var imgData = ctx.getImageData(0, 0, viewWidth, viewHeight);

    // var scalar = this._builder.interpolate(81.33220987136266, 11.08163278839247);
    // console.log(scalar,'==;;==')
    for (var row = 0; row < viewHeight; row++) {
      for (var col = 0; col < viewWidth; col++) {
        var point = L.point(col, row);
        var coord = this._map.containerPointToLatLng(point);
        if (coord) {
          var λ = coord.lng % 360, φ = coord.lat;
          // var λ = alp*col+bounds._southWest.lng+200, φ = beta*row+bounds._southWest.lat;
          var scalar = this._builder.interpolate(λ, φ);
          var index = row * viewWidth + col;
          var imgDataIndex = index * 4;
          var color = [0, 0, 0, 0];
          color = this._product.scale.gradient(scalar, OVERLAY_ALPHA);
          imgData.data[imgDataIndex] = color[0];
          imgData.data[imgDataIndex + 1] = color[1];
          imgData.data[imgDataIndex + 2] = color[2];
          imgData.data[imgDataIndex + 3] = color[3];
          // if(col>10)return
          // else {
          //   console.log(row,col,λ, φ,scalar,'==;;==')
          // }
        } else {
          console.error('----------------')
        }
      }
    }
    ctx.putImageData(imgData, 0, 0, 0, 0, viewWidth, viewHeight);
    // console.log(imgData.data.length,'length',canvas.style.width,canvas.style.height)
  },
  test: function (map) {
    var size = map.getSize();
    var pixelBounds = map.getPixelBounds();
    var bounds = map.getBounds();
    var latlons = map.containerPointToLatLng(size);
    console.log('bounds', bounds.getEast(), bounds.getNorth(), bounds.getWest(), bounds.getSouth());
    console.log('pixelBounds', pixelBounds);
    console.log('size', size);
    console.log('latlons', latlons);
  },
  _updateOpacity: function () {
    var canvas = this._canvas;
    L.DomUtil.setOpacity(canvas, this.options.opacity);
  },
  setData: function (product, data,type) {
    this._data = data;
    this._product = product;
    // this._builder = this._product.build(this._data);
    this._productType = type;
    this._builder = this._product.build(this._data,this._productType);
    this._draw();
  },
  interpolate: function (lng, lat) {
    return this._builder.interpolate(lng, lat);
  }

});
L.distributionOverlay = function (options, product, data, colorKeys) {
  return new L.DistributionOverlay(options, product, data, colorKeys);
};