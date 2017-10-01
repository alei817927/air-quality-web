var CONFIG = {
  WEATHER: {
    TEMP: {
      name: '温度',
      unit: '°C',
      colors: [
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
      ]
    }
  },
  AQ: {
    PM25: {
      name: 'PM₂.₅',
      unit: 'μg/m³',
      colors: []
    },
    O3: {
      name: 'O₃',
      unit: 'μg/m³',
      colors: []
    },
    PM10: {
      name: 'PM₁₀',
      unit: 'μg/m³',
      colors: []
    },
    SO2: {
      name: 'SO₂',
      unit: 'μg/m³',
      colors: []
    },
    NO2: {
      name: 'NO₂',
      unit: 'μg/m³',
      colors: []
    },
    CO: {
      name: 'CO',
      unit: 'mg/m³',
      colors: []
    }
  }
};