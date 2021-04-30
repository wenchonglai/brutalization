import createComponent from "../util/easyjs.js";
import VirtualDOM, { VirtualCanvas } from "../util/virtual-dom.js";
import {screenToGrid, mapToScreen} from "../util/coordinate-converter.js";
import SceneObject from "./scene-object.js";
import MapSVG from "./map-svg.js";
import {PIXEL_PER_GRID, MIN_ZOOM, MAX_ZOOM} from "../settings/map-settings.js";
import {marchEventListeners, raidEventListeners} from "./interactions/move.js";

class MapCanvas extends VirtualCanvas{
  constructor(props){
    super({...props, className: "map-canvas"});

    this.rect({x: 0, y: 0, width: this.width, height: this.height, fill: "#5f9f3f"});
  }
}

class UnitCanvas extends VirtualCanvas{
  constructor(props){
    super({...props, className: "unit-canvas"});
  }
}

class AnnotationLayer extends VirtualDOM{
  constructor({width, height, eventListeners = {}}){
    super('div', {className: "annotation-layer", style: {width, height}});
  }
}

export default class Renderer extends VirtualDOM{
  constructor({game}){
    super('div', {className: "renderer"});

    this._dom.id = 'map';
    this._dom.className = 'map';
    this._game = game;
    this._animationFrame = undefined;
    this._scene = new Map();
    this._dragMode = false;
    this._dragged = false;
    this._eventListeners = {};

    const length = game.mapSize * PIXEL_PER_GRID;

    this._mapSVG = new MapSVG({width: length, height: length});
    this._mapCanvas = new MapCanvas({width: length, height: length});
    this._unitCanvas = new UnitCanvas({width: length, height: length});

    this._isometricWrapper = createComponent('div', 
      {className: 'isometric-wrapper'},
      this.mapCanvas, this.unitCanvas, this._mapSVG
    );

    this._annotationLayer = new AnnotationLayer({
      width: length, height: length,
    });

    this._dragStartXY = {};
    this._highlightedGridXY = {};

    this.append(this._isometricWrapper);
    this.append(this._annotationLayer);

    this.changeMapInteraction("", {});

    this.transform({x: 0, y: 0, zoom: 1});
  }

  get mapSVG(){ return this._mapSVG; }
  get mapCanvas(){ return this._mapCanvas; }
  get unitCanvas(){ return this._unitCanvas; }
  get mapCtx(){ return this._mapCtx; }
  get canvasLength(){ return this._canvasLength; }
  get game(){return this._game;}
  get scene(){ return this._scene; }
  get annotationLayer(){ return this._annotationLayer; }
  get eventListeners(){ return this._eventListeners; }
  get gameObject(){ return this._gameObject; }
  get dragMode(){ return this._dragMode; }
  get highlightedGridXY(){ return this._highlightedGridXY; }
  get transformAttributes(){ return this._transformAttributes; }
  get eventListeners(){ return this._eventListeners; }
  get command(){ return this._command; }

  listenAll(eventListeners){
    for (let [type, func] of Object.entries(eventListeners)){
      let prevFunc = this.eventListeners?.[type];

      if (prevFunc !== func){
        this.unlisten(type, this.eventListeners[type]);
        this.listen(type, func)
        this.eventListeners[type] = func;
      }
    }
  }

  defaultDragStart(e){
    this._dragMode = true;
    this._dragStartXY = {x: e.x, y: e.y};
  }
  defaultDragEnd(e){
    if (!this._dragMode) return;

    if (!this._dragged) {};
    
    const {x, y, zoom} = this._transformAttributes;
    const dx = e.x - this._dragStartXY.x;
    const dy = e.y - this._dragStartXY.y;

    this._dragStartXY = {};
    this._dragMode = false;
    this._dragged = false;

    this._transformAttributes = { x: x + dx, y: y + dy, zoom};
    this.transform(this._transformAttributes, false);
  }
  defaultDrag(e){
    if (!this._dragMode){
      let {x, y} = screenToGrid(e, {
        translateX: this._transformAttributes?.x || 0,
        translateY: this._transformAttributes?.y || 0,
        zoom: this._transformAttributes?.zoom || 1
      });

      if (
        x !== this._highlightedGridXY.x || 
        y !== this._highlightedGridXY.y
      ) {
        this._highlightedGridXY = {x, y};
      }
      return;
    };

    const {x, y, zoom} = this._transformAttributes;
    const dx = e.x - this._dragStartXY.x;
    const dy = e.y - this._dragStartXY.y;

    if (dx !== 0 || dy !== 0) this._dragged = true;

    this._animationFrame = requestAnimationFrame( () => 
      this.transform({x: x + dx, y: y + dy, zoom}, false)
    );
  }

  defaultScroll(e){
    const {x, y, zoom} = this._transformAttributes;
    const newZoom = Math.min(Math.max(MIN_ZOOM, zoom - e.deltaY / 64), MAX_ZOOM);

    this.transform({
      x: x * newZoom / zoom - e.x * (newZoom / zoom - 1),
      y: y * newZoom / zoom - e.y * (newZoom / zoom - 1),
      zoom: newZoom
    });
  }

  transform({x, y, zoom}, updateTransformAttributes = true){ 
    cancelAnimationFrame(this._animationFrame);

    this._animationFrame = requestAnimationFrame(() => {
      if (updateTransformAttributes)
        this._transformAttributes = {x, y, zoom};
      
      let transformString = [
        `translate(${x}px, ${y}px) scale(${zoom})`
      ].join(' ');
    
      this._dom.style.transform = transformString;
    });
  }

  update(gameObject){
    SceneObject.getSceneObject(gameObject).update();
  }
  addToScene(gameObject){
    let sceneObject = new SceneObject({renderer: this, gameObject});
  }
  removeFromScene(gameObject){
    let sceneObject = SceneObject.getSceneObject(gameObject);
    SceneObject.deleteSceneObject(gameObject)
    sceneObject.destruct();
  }

  appendUnitAnnotation(unitAnnotation){
    this.annotationLayer.append(unitAnnotation);
  }

  focus(gameObject){
    this._gameObject = gameObject;

    if (gameObject){
      let {x, y} = mapToScreen(gameObject);

      this.mapSVG.reset();
  
      this.transform({
        x: (window.innerWidth >> 1) + 128 - x,
        y: (window.innerHeight >> 1) - y,
        zoom: this._transformAttributes?.zoom || 1
      });
  
      SceneObject.focus(gameObject);
    }
  }
  changeMapInteraction(mode, {gameObject, command}){
    let eventListeners;

    this._command = command;

    switch (mode){
      case "march": 
        eventListeners = this._bindAllListeners(marchEventListeners);
        break;
      case "raid":
        eventListeners = this._bindAllListeners(raidEventListeners);
        break;
      default: {
        const handleDragEnd = this.defaultDragEnd.bind(this);
        eventListeners = {
          mousemove: this.defaultDrag.bind(this),
          mousedown: this.defaultDragStart.bind(this),
          mouseup:   handleDragEnd,
          mouseleave:  handleDragEnd,
          wheel:     this.defaultScroll.bind(this)
        }; 
      }; break;
    }

    this.listenAll(eventListeners);
  }

  _bindAllListeners(listeners){
    return Object.fromEntries(
      Object
        .entries(listeners)
        .map(([key, val]) => [
          key, val.bind(this)
        ])
    );
  }
}