import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaCanvasRendering from "./meta-canvas-rendering.js";

export default class UnitRendering extends MetaCanvasRendering{
  constructor(gameObject, renderer){
    super(gameObject, renderer, renderer.unitCanvas)
  }
  update(){
    MetaCanvasRendering.prototype.update.call(this);

    const {population, x, y, formation} = this.gameObject;
    const legions = population / 250 | 0;
    const denselyFormed = formation.every(el => el === 0);
    const normalCols = denselyFormed ? Math.ceil(legions ** 0.5) : 12;
    const rows = Math.ceil(legions / normalCols);
    const residualCols = legions % normalCols;
    this._x = x * PIXEL_PER_GRID;
    this._y = y * PIXEL_PER_GRID;

    let imageData = this.ctx.createImageData(PIXEL_PER_GRID, PIXEL_PER_GRID);
    const angle = Math.atan2(...formation);
    const COS = Math.round(Math.cos(angle));
    const SIN = Math.round(Math.sin(angle));
    const GAP = (COS !== 0 && SIN !== 0 || denselyFormed) ? 2 : 3;

    for (let row = 0; row < rows; row++){
      let cols = row === (rows - 1) ? (residualCols || normalCols) : normalCols;

      for (let col = 0; col < cols; col++){
        const px0 = rows * GAP / (denselyFormed ? 2 : 1) - (row + 1) * GAP;
        const py0 = -cols * GAP / 2 + col * GAP;
        const px = PIXEL_PER_GRID / 2 + Math.round(px0 * COS - py0 * SIN);
        const py = PIXEL_PER_GRID / 2 + Math.round(px0 * SIN + py0 * COS);

        const index = (px * PIXEL_PER_GRID + py) * 4;

        imageData.data[index + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, this._x, this._y);
  }
}