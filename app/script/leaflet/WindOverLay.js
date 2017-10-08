L.WindOverlay = L.Layer.extend({
  initialize: function initialize(data, options) {
    this._map = null;
    this._canvas = null;
    this._data = data;
    L.setOptions(this, options);
  },
  _onLayerDidResize: function _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  _onLayerDidMove: function _onLayerDidMove() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  },
  getEvents: function getEvents() {
    var events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove
    };
    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }

    return events;
  },
  onAdd: function onAdd(map) {
    this._map = map;
    var size = this._map.getSize();

    this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

    map._panes.overlayPane.appendChild(this._canvas);
    // this._context = this._canvas.getContext('2d');
    this._windy = new Windy({canvas: this._canvas, data: this._data});
    // map.on(this.getEvents(), this);
    // this._map.on('dragstart', this._windy.stop);
    // this._map.on('zoomstart', this._clearWind);
    // this._map.on('resize', this._clearWind);
    this._map.on('zoomstart', this._windy.stop);
    this._map.on('resize', this._windy.stop);

    this.drawLayer();
  },
  onRemove: function onRemove(map) {
    map.getPanes().overlayPane.removeChild(this._canvas);
    map.off(this.getEvents(), this);
    this._canvas = null;
  },
  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },
  drawLayer: function drawLayer() {
    var size = this._map.getSize();
    var bounds = this._map.getBounds();
    var self = this._windy;
    setTimeout(function () {
      self.start([[0, 0], [size.x, size.y]], size.x, size.y, [[bounds._southWest.lng, bounds._southWest.lat], [bounds._northEast.lng, bounds._northEast.lat]]);
    }, 1000);
  },
  // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
  _setTransform: function _setTransform(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);

    el.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? 'translate(' + pos.x + 'px,' + pos.y + 'px)' : 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') + (scale ? ' scale(' + scale + ')' : '');
  },

  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom);
    // -- different calc of offset in leaflet 1.0.0 and 0.0.7 thanks for 1.0.0-rc2 calc @jduggan1
    var offset = L.Layer ? this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), e.zoom, e.center) : this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    L.DomUtil.setTransform(this._canvas, offset, scale);
  },
  setData: function (data) {
    this._data = data;
    this._windy.update(this._data);
    this.drawLayer();
  },
  interpolate: function (lon, lat) {
    return this._windy.interpolatePoint(lon, lat);
  },
  vectorToDegrees: function vectorToDegrees(uMs, vMs) {
    var windAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    var windDirTrigTo = Math.atan2(uMs / windAbs, vMs / windAbs);
    var windDirTrigToDegrees = windDirTrigTo * 180 / Math.PI;
    var windDirTrigFromDegrees = windDirTrigToDegrees + 180;
    return windDirTrigFromDegrees.toFixed(3);
  },
  vectorToSpeed: function vectorToSpeed(uMs, vMs) {
    var windAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    return windAbs;
  }

  // _clearWind: function _clearWind() {
  //   if (this._windy) this._windy.stop();
  //   if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  // }

});
L.windOverlay = function (data, options) {
  return new L.WindOverlay(data, options);
};