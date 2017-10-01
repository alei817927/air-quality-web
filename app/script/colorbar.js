var colorbar = function (id, colors) {
  // var colors = this._product.scale.colors;
  // var c = document.getElementById("cbc");
  var canvas = document.getElementById(id);
  var ctx = canvas.getContext("2d");
  return {
    draw: function () {
      var my_gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      var factor = 1 / (colors.length - 1);
      var i = 0;
      for (; i < colors.length; i++) {
        var color = colors[i];
        var point = color[0];
        var _color = 'rgb(' + color[1][0] + ',' + color[1][1] + ',' + color[1][2] + ')';
        var index = i * factor;
        my_gradient.addColorStop(index, _color);
      }
      ctx.fillStyle = my_gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = "10px Verdana";
      for (i = 0; i < colors.length; i++) {
        var x = canvas.width * i * factor;
        var value = µ.round(colors[i][0] - 273.15, 1);
        ctx.fillText(value, x, 15);
        // console.log(i, x, value, c.width)
      }
    }
  }
};