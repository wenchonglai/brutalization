import { City } from "../tiles/city.js";
import { Camp } from "../tiles/settlement.js";
import { Unit } from "../units/unit.js";
import CityAnnotation from "./annotations/city-annotation.js";
import CampAnnotation from "./annotations/camp-annotation.js";
import UnitAnnotation from "./annotations/unit-annotation.js";
import CityRendering from "./canvas-renderings/city-rendering.js";
import UnitRendering from "./canvas-renderings/unit-rendering.js";
import CampRendering from "./canvas-renderings/camp-rendering.js";

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
    });
  }

  constructor({renderer, gameObject}){
    this._gameObject = gameObject;
    this._focused = false;
    this._renderer = renderer;
    
    if (gameObject instanceof Unit){
      this._virtualDom = new UnitAnnotation(gameObject);
      this._canvasAlias = new UnitRendering(gameObject, renderer);

    } else if (gameObject instanceof City){
      this._virtualDom = new CityAnnotation(gameObject);
      this._canvasAlias = new CityRendering(gameObject, renderer);
      // this._canvasAlias = new UnitRendering(gameObject, renderer);
    } else if (gameObject instanceof Camp){
      // this._virtualDom = new CampAnnotation(gameObject);
      this._canvasAlias = new CampRendering(gameObject, renderer);
    }
    
    this._virtualDom && renderer.appendAnnotation(this._virtualDom);
    SceneObject.sceneObjects.set(gameObject, this);
  }

  get renderer(){ return this._renderer; }
  get focused(){ return this._focused; }
  get mapSVG(){ return this.renderer.mapSVG; }
  get virtualDom(){ return this._virtualDom; }
  get virtualSVG(){ return this._virtualSVG; }
  get canvasAlias(){ return this._canvasAlias; }
  get gameObject(){ return this._gameObject; }

  update(action){
    this.virtualDom?.update(action);
    this.canvasAlias?.update(action);
  }

  destruct(){
    this._virtualDom?.detach();
    this._virtualSVG?.detach();
  }

  focus(){
    if (this.focused) return;

    this._focused = true;
    this.virtualDom?.addClass('active');

    this.gameObject instanceof Unit &&
      this.mapSVG.updateUnitIndicators(this.gameObject);
  }
  blur(){
    if (!this.focused) return;

    this._focused = false;
    this.virtualDom?.removeClass('active');
  }
} 