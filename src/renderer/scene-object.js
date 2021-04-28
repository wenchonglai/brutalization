import { Unit } from "../units/unit.js";
import VirtualDOM from "../util/virtual-dom.js";

class UnitIndicator extends VirtualDOM{
  constructor(gameObject){
    super('div', {
      className: "unit-indicator",
      style: { zIndex: gameObject.x + gameObject.y }
    }, '💂🏻');
  }
}

export default class SceneObject{
  constructor(gameObject){
    if (gameObject instanceof Unit){
      this._virtualDom = new UnitIndicator(gameObject)
    }
    // this._virtualDom = virtualDom;
    // this._virtualSVG = virtualSVG;
    // this._canvasFunction = canvasFunction;
  }
  get virtualDom(){ return this._virtualDom; }
  get virtualSVG(){ return this._virtualSVG; }
  get canvasFunction(){ return this._canvasFunction; }
} 