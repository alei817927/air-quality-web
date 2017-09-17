var Esri_WorldImagery = L.tileLayer.grayscale('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
  attribution: '',
  subdomains: ["1", "2", "3", "4"]
});

var map = L.map('map', {
  layers: [Esri_WorldImagery],
  minZoom: 3,
  maxZoom: 16,
  zoomControl:false,
  noWrap: true,
  maxBounds:[[84.67351256610522, -174.0234375], [-58.995311187950925, 223.2421875]]
});
map.attributionControl.setPrefix(false);

map.setView([34.53, 104.7], isMobile() ? 3 : 5);


$.getJSON('/demo/demo.json', function (data) {
  // data[0].data=[];
  // console.log(data.constructor.toString(),data.length,data[0].data.length);
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
  // L.distributionOverlay({opacity: 0.5}, data, colors, [0, 1, 2, 3, 5, 10, 20, 35, 50, 75, 90, 115, 130, 150, 250, 350]).addTo(map);
  // L.distributionOverlay({opacity: 0.5}, data, colors, [0, 100, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330]).addTo(map);
  L.distributionOverlay({opacity: 0.5}, data, colors, [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 280, 300, 320, 340]).addTo(map);
  L.windOverlay(data, {}).addTo(map);
});