import { Unit } from "../units/unit.js";
import { mapToScreen } from "../util/coordinate-converter.js";
import VirtualDOM from "../util/virtual-dom.js";

const GRID_SIZE = 64;

class UnitAnnotation extends VirtualDOM{
  constructor(gameObject){
    super('div', {
      className: "unit-indicator",
      style: { 
        backgroundColor: gameObject.player.color
      },
      onClick: (e) => {
        gameObject.player.focus(gameObject);
      }
    }, '💂🏻');

    this._gameObject = gameObject;

    this.update();
  }

  get gameObject(){ return this._gameObject; }

  update(){
    this.setStyles({
      zIndex: this.gameObject.x + this.gameObject.y,
    });

    const x = this.gameObject.x + 0.5;
    const y = this.gameObject.y + 0.5;
    const screenXY = mapToScreen({x, y});

    this._dom.style.left = screenXY.x;
    this._dom.style.top = screenXY.y;
  }
}

class UnitRendering{
  constructor(gameObject, renderer){
    this._ctx = renderer.unitCanvas;
    this._gameObject = gameObject;
    this._x = -GRID_SIZE;
    this._y = -GRID_SIZE;
    this.update();
  }
  get x(){ return this._x; }
  get y(){ return this._y; }
  get ctx(){ return this._ctx; }
  get gameObject(){ return this._gameObject; }
  update(){
    this.ctx.clearRect({
      x: this.x,
      y: this.y,
      width: GRID_SIZE,
      height: GRID_SIZE
    });

    const {population, x, y, formation} = this.gameObject;
    const legions = population / 250 | 0;
    const denselyFormed = formation.every(el => el === 0);
    const normalCols = denselyFormed ? Math.ceil(legions ** 0.5) : 12;
    const rows = Math.ceil(legions / normalCols);
    const residualCols = legions % normalCols;
    this._x = x * GRID_SIZE;
    this._y = y * GRID_SIZE;

    let imageData = this.ctx.createImageData(GRID_SIZE, GRID_SIZE);
    const angle = Math.atan2(...formation);
    const COS = Math.round(Math.cos(angle));
    const SIN = Math.round(Math.sin(angle));
    const GAP = (COS !== 0 && SIN !== 0 || denselyFormed) ? 2 : 3;

    for (let row = 0; row < rows; row++){
      let cols = row === (rows - 1) ? (residualCols || normalCols) : normalCols;

      for (let col = 0; col < cols; col++){
        const px0 = rows * GAP / (denselyFormed ? 2 : 1) - (row + 1) * GAP;
        const py0 = -cols * GAP / 2 + col * GAP;
        const px = GRID_SIZE / 2 + Math.round(px0 * COS - py0 * SIN);
        const py = GRID_SIZE / 2 + Math.round(px0 * SIN + py0 * COS);

        const index = (px * GRID_SIZE + py) * 4;

        imageData.data[index + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, this._x, this._y);
  }
}

export default class SceneObject{
  static sceneObjects = new Map();
  static getSceneObject(gameObject){
    return SceneObject.sceneObjects.get(gameObject);
  }
  static deleteSceneObject(gameObject){
    return SceneObject.sceneObjects.delete(gameObject);
  }
  static focus(gameObject){
    SceneObject.sceneObjects.forEach((sceneObj, gameObj) => {

      if (gameObj === gameObject) sceneObj.focus();
      else sceneObj.blur();
    })
  }

  constructor({renderer, gameObject}){
    if (gameObject instanceof Unit){
      this._gameObject = gameObject;
      this._virtualDom = new UnitAnnotation(gameObject);
      this._canvasAlias = new UnitRendering(gameObject, renderer);

      renderer.appendUnitAnnotation(this._virtualDom);
    }

    SceneObject.sceneObjects.set(gameObject, this);
  }

  get virtualDom(){ return this._virtualDom; }
  get virtualSVG(){ return this._virtualSVG; }
  get canvasAlias(){ return this._canvasAlias; }
  get gameObject(){ return this._gameObject; }

  update(){
    this.virtualDom?.update();
    this.canvasAlias?.update();
  }

  destruct(){
    this._virtualDom.parentNode?.removeChild(this._virtualDom);
    this._virtualSVG.parentNode?.removeChild(this._virtualSVG);
  }

  focus(){
    this.virtualDom.addClass('active');
  }
  blur(){
    this.virtualDom.removeClass('active');
  }
} 