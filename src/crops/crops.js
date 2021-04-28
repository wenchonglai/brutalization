// north: -5 ~ 20 ˚C wheat
// north-central: 0 ~ 25 ˚C wheat - wheat/millet
// south-central: 5 ~ 30 ˚C wheat - rice
// south: 10 ~ 30 ˚C wheat - rice - rice
const CROPS = {
  "wheat": {
    yield: 2000,
    aggregatedTemp: 100,
    minTemp: 0
  },
  "millet": {
    yield: 2250,
    aggregatedTemp: 150,
    minTemp: 10
  },
  "rice": {
    yield: 5500,
    aggregatedTemp: 160,
    minTemp: 15
  }
};