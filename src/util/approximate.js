const SCALE = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

const bisectLeft = (arr, val) => {
  let l = 0;
  let r = arr.length;

  while (l < r){
    let m = ( l + r ) >> 1;

    if (val <= arr[m]) r = m
    else l = m + 1
  }

  return l;
}

export default function approximate(value, {isPercentage = false, accuracy = 0.1} = {}){
  const modIndex = Math.min(bisectLeft(SCALE, value * accuracy), SCALE.length - 1);
  const mod = SCALE[modIndex];
  return Math.round(value / mod) * mod;
}