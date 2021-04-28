import { Unit } from "../units/unit.js";
import { mapToScreen } from "../util/coordinate-converter.js";
import VirtualDOM from "../util/virtual-dom.js";

const GRID_SIZE = 64;

class UnitAnnotation extends VirtualDOM{
  constructor(gameObject){
    super('div', {
      className: "unit-indicator",
      style: { 
        zIndex: gameObject.x + gameObject.y,
        backgroundColor: gameObject.player.color
      },
      onClick: (e) => {
        gameObject.player.focus(gameObject);
      }
    }, '💂🏻');

    const x = gameObject.x + 0.5;
    const y = gameObject.y + 0.5;
    const screenXY = mapToScreen({x, y});

    this._dom.style.left = screenXY.x;
    this._dom.style.top = screenXY.y;

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
      this._virtualDom = new UnitAnnotation(gameObject)

      renderer.appendUnitAnnotation(this._virtualDom);
    }
    // this._virtualDom = virtualDom;
    // this._virtualSVG = virtualSVG;
    // this._canvasFunction = canvasFunction;

    SceneObject.sceneObjects.set(gameObject, this);
    
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

  get virtualDom(){ return this._virtualDom; }
  get virtualSVG(){ return this._virtualSVG; }
  get canvasFunction(){ return this._canvasFunction; }
} 