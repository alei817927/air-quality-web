var products = function () {
  "use strict";

  function buildProduct(overrides) {
    return _.extend({
      date: null,
      build: function (data) {
        var me = this;
        var _builder = me.builder(data);
        return buildGrid(_builder);
      }
    }, overrides);
  }

  var FACTORIES = {
    "temp": {
      matches: _.matches({param: "wind", overlayType: "temp"}),
      create: function (attr) {
        return buildProduct({
          field: "scalar",
          type: "temp",
          builder: function (file) {
            var record = file[0];
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
          units: [
            {
              label: "°C",
              conversion: function (x) {
                return x - 273.15;
              },
              precision: 1
            }
          ],
          scale: {
            bounds: [193, 328],
            gradient: µ.segmentedColorScale([
              [193, [37, 4, 42]],
              [206, [41, 10, 130]],
              [219, [81, 40, 40]],
              [233.15, [192, 37, 149]],  // -40 C/F
              [255.372, [70, 215, 215]],  // 0 F
              [273.15, [21, 84, 187]],   // 0 C
              [275.15, [24, 132, 14]],   // just above 0 C
              [291, [247, 251, 59]],
              [298, [235, 167, 21]],
              [311, [230, 71, 39]],
              [328, [88, 27, 67]]
            ])
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


  function buildGrid(builder) {
    var header = builder.header;
    var λ0 = header.lo1, φ0 = header.la1;  // the grid's origin (e.g., 0.0E, 90.0N)
    var Δλ = header.dx, Δφ = header.dy;    // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
    var ni = header.nx, nj = header.ny;    // number of grid points W-E and N-S (e.g., 144 x 73)
    var date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime);

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

    console.log('buildGrid')
    function interpolate(λ, φ) {
      var i = µ.floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
      var j = (φ0 - φ) / Δφ;                 // calculate latitude index in direction +90 to -90

      if(j<0)console.error('j invalid',j);
      if(i<0)console.error('i invalid',i);

      var fi = Math.floor(i), ci = fi + 1;
      var fj = Math.floor(j), cj = fj + 1;

      var row;
      if ((row = grid[fj])) {
        var g00 = row[fi];
        var g10 = row[ci];
        if (µ.isValue(g00) && µ.isValue(g10) && (row = grid[cj])) {
          var g01 = row[fi];
          var g11 = row[ci];
          if (µ.isValue(g01) && µ.isValue(g11)) {
            // All four points found, so interpolate the value.
            return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
          }
        }
      }
      return null;
    }

    return {
      date: date,
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
