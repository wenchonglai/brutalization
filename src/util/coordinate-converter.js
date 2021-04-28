const ROT_X = 60;
const ROT_Z = 40;
const COS = Math.cos(Math.PI * 2 / 9);
const SIN = Math.sin(Math.PI * 2 / 9);
const COS_X = Math.cos(Math.PI / 3);
const GRID_SIZE = 64;

export const mapToScreen = ({x, y}, {translateX = 0, translateY = 0, zoom = 1} = {}) => {
  return {
    x: translateX + zoom * GRID_SIZE * ( x * COS - y * SIN),
    y: translateY + zoom * COS_X * GRID_SIZE * (x * SIN + y * COS)
  }
};

export const screenToMap = ({x, y}, {translateX = 0, translateY = 0, zoom = 1} = {}) => {
  let dx = (x - translateX) / zoom;
  let dy = (y - translateY) / zoom;

  return {
    x: (dx * COS + dy * SIN / COS_X) / GRID_SIZE, 
    y: (dy * COS / COS_X - dx * SIN) / GRID_SIZE
  }
};
