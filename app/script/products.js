var products = function () {
  "use strict";

  function buildProduct(overrides) {
    return _.extend({
      date: null,
      build: function (data, type) {
        var me = this;
        var _builder = me.builder(data);
        // if (type === 'aq') return buildAqGrid(_builder);
        return buildGrid(_builder);
      }
    }, overrides);
  }

  var FACTORIES = {
    "TEMP": {
      create: function (attr) {
        return buildProduct({
          builder: function (record) {
            // console.log(file)
            var data = record.data;
            return {
              header: record.header,
              interpolate: bilinearInterpolateScalar,
              data: function (i) {
                return data[i];
              }
            }
          },
          scale: {
            gradient: µ.segmentedColorScale(CONFIG.PRODUCTS.TEMP.colors)
          }
        });
      }
    },
    "PM25": {
      create: function (attr) {
        return buildProduct({
          builder: function (record) {
            // console.log(file)
            var data = record.data;
            return {
              header: record.header,
              interpolate: bilinearInterpolateScalar,
              data: function (i) {
                return data[i];
              }
            }
          },
          scale: {
            gradient: µ.segmentedColorScale(CONFIG.PRODUCTS.PM25.colors)
          }
        });
      }
    }

  };

  function gfsDate(attr) {
    if (attr.date === "current") {
      var now = new Date(Date.now()), hour = Math.floor(now.getUTCHours() / 3);
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour));
    }
    var parts = attr.date.split("/");
    return new Date(Date.UTC(+parts[0], parts[1] - 1, +parts[2], +attr.hour.substr(0, 2)));
  }

  function bilinearInterpolateScalar(x, y, g00, g10, g01, g11) {
    // console.log((x, y, g00, g10, g01, g11), '---------')
    var rx = (1 - x);
    var ry = (1 - y);
    return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
  }

  function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
    var rx = (1 - x);
    var ry = (1 - y);
    var a = rx * ry, b = x * ry, c = rx * y, d = x * y;
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return [u, v, Math.sqrt(u * u + v * v)];
  }


  function buildProjection(header) {
    return '+proj=lcc +lat_1=' + header.palp
      + ' +lat_2=' + header.pbet
      + ' +lat_0=' + header.ycent
      + ' +lon_0=' + header.xcent
      + ' +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
  }

  function buildAqGrid(builder) {
    var header = builder.header;
    var col = header.col, row = header.row;    // number of grid points W-E and N-S (e.g., 144 x 73)
    var points = [], p = 0;
    var projection = buildProjection(header);
    console.log(projection)
    var transform = proj4(projection);
    var min, max;
    for (var r = 0; r < row; r++) {
      for (var c = 0; c < col; c++, p++) {
        //var keys = ['x0', 'y0', 'xcell', 'ycell', 'row', 'col', 'x1', 'y1', 'xcent', 'ycent', 'palp', 'pbet'];
        var llp = transform.inverse([header.x0 + header.xcell * c, header.y0 + header.ycell * r]);
        if (p === 0) {
          min = {x: llp[0], y: llp[1]};
          max = {x: llp[0], y: llp[1]};
          console.log('=', min, max)
        } else {
          max.x = max.x < llp[0] ? llp[0] : max.x;
          max.y = max.y < llp[1] ? llp[1] : max.y;
          min.x = min.x > llp[0] ? llp[0] : min.x;
          min.y = min.y > llp[1] ? llp[1] : min.y;
        }
        points.push({x: llp[0], y: llp[1], i: p, d: builder.data(p)});
      }
    }
    var tree = new kdTree(points, function distance(a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return dx * dx + dy * dy;
    }, ['x', 'y']);

    console.log(points.length, max, min, '-----------;;;;;;;;')

    function interpolate(lng, lat) {
      if ((lng > max.x || lat > max.y) || (lng < min.x || lat < min.y)) {
        return 0;
      }
      var nearest = tree.nearest({x: lng, y: lat}, 1);
      // var p1 = nearest[0][0];
      // var p2 = nearest[1][0];
      // var p3 = nearest[2][0];
      // var p4 = nearest[3][0];
      // console.log(p1,p2,p3,p4)
      return nearest[0][0].d;
    }

    return {
      interpolate: interpolate
    };
  }

  function buildGrid(builder) {
    var header = builder.header;
    var λ0 = header.lo1, φ0 = header.la1;  // the grid's origin (e.g., 0.0E, 90.0N),左上角
    var Δλ = header.dx, Δφ = header.dy;    // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
    var ni = header.nx, nj = header.ny;    // number of grid points W-E and N-S (e.g., 144 x 73)

    var grid = [], p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;
    for (var j = 0; j < nj; j++) {
      var row = [];
      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }
      if (isContinuous) {
        row.push(row[0]);
      }
      grid[j] = row;
    }

    // console.log('buildGrid', Δφ, Δλ, λ0, φ0, grid.length, grid[0].length)
    console.log('buildGrid', header)

    function interpolate(λ, φ) {
      if (header.la1 < φ || header.lo1 > λ || header.lo2 < λ || header.la2 > φ) {
        return 0;
      }
      var i = µ.floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
      var j = (φ0 - φ) / Δφ;                 // calculate latitude index in direction +90 to -90
      if (j < 0) console.error('j invalid', j,φ0,φ,Δφ);
      // if (i < 0) console.error('i invalid', i);
      // if (i < 0 || j < 0) {
      //   return null;
      // }
      var fi = Math.floor(i), ci = fi + 1;
      var fj = Math.floor(j), cj = fj + 1;
      if (i < 0 || j < 0) {
        return null;
      }
      // if(Δφ!==1&&Δλ!==1) console.log(λ , λ0,Δλ,i,';',φ0 ,φ,Δφ,j,';',fi,fj,'~~~');

      var row;
      if ((row = grid[fj])) {
        var g00 = row[fi];
        var g10 = row[ci];
        if (µ.isValue(g00) && µ.isValue(g10) && (row = grid[cj])) {
          var g01 = row[fi];
          var g11 = row[ci];
          if (µ.isValue(g01) && µ.isValue(g11)) {
            // All four points found, so interpolate the value.
            var value= builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
            // console.error(λ, φ,value);
            return value;
          }
        }
      }
      return null;
    }

    return {
      interpolate: interpolate,
      forEachPoint: function (cb) {
        for (var j = 0; j < nj; j++) {
          var row = grid[j] || [];
          for (var i = 0; i < ni; i++) {
            cb(µ.floorMod(180 + λ0 + i * Δλ, 360) - 180, φ0 - j * Δφ, row[i]);
          }
        }
      }
    };
  }


  function productsFor(attributes) {
    for (var i in FACTORIES) {
      if (i === attributes) {
        return FACTORIES[i].create(attributes);
      }
    }
    return null;
  }


  return {
    productsFor: productsFor
  };
}();
