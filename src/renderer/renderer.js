import createComponent from "../util/easyjs.js";
import VirtualDOM, { VirtualCanvas } from "../util/virtual-dom.js";
import {screenToMap, mapToScreen} from "../util/coordinate-converter.js";
import SceneObject from "./scene-object.js";

const PIXEL_PER_GRID = 64;
const COS = Math.cos(Math.PI * 2 / 9);
const SIN = Math.sin(Math.PI * 2 / 9);
const COS_X = Math.cos(Math.PI / 3);

class GridLayer extends VirtualDOM{
  constructor({width, height
  }){
    super('g');

    for (let i = 0; i < width; i += PIXEL_PER_GRID)
      this.append( 
        createComponent('path', {
          d: `M ${i} 0 L ${i} ${height}`,
          stroke: "#0000003f",
        })
      );

    for (let i = 0; i < height; i += PIXEL_PER_GRID)
      this.append( 
        createComponent('path', {
          d: `M 0 ${i} L ${width} ${i}`,
          stroke: "#0000003f",
        })
      );
    
    this._highlightedGrid = createComponent('rect', {
      stroke: "#00df3f", fill: "#00df3f1f",
      "stroke-width": 3,
      width: PIXEL_PER_GRID, height: PIXEL_PER_GRID
    });

    this.append(this._highlightedGrid);
  }

  highlight({x, y}){
    this._highlightedGrid.setAttribute("x", x * PIXEL_PER_GRID);
    this._highlightedGrid.setAttribute("y", y * PIXEL_PER_GRID);
    
  }
}

class MapSVG extends VirtualDOM{
  constructor({
    width, height, handleDrag, handleDragStart, handleDragEnd, handleScroll
  }){
    super('svg');
    
    this._dom.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this._dom.style.width = String(width);
    this._dom.style.height = height;

    this.gridLayer = new GridLayer({
      width, height,
      handleDrag, handleDragStart, handleDragEnd, handleScroll
    });
    
    this.listen('mousedown', e => handleDragStart(e));
    this.listen('mouseup', e => handleDragEnd(e));
    this.listen('mouseleave', e => handleDragEnd(e));
    this.listen('mousemove', e => handleDrag(e));
    this.listen('wheel', e => handleScroll(e));

    this.append(this.gridLayer);  
    
  }
  get svg(){ return this._dom; }

  updateHighlightedGrid({x, y}){
    this.gridLayer.highlight({x, y});
  }
}

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
  constructor({width, height}){
    super('div', {className: "annotation-layer"});
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

    const length = game.mapSize * PIXEL_PER_GRID;

    this._mapSVG = new MapSVG({
      width: length, height: length,
      handleDrag: this.handleDrag.bind(this),
      handleDragStart: this.handleDragStart.bind(this),
      handleDragEnd: this.handleDragEnd.bind(this),
      handleScroll: this.handleScroll.bind(this)
    });

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

    this.transform({x: 0, y: 0, zoom: 1});
  }

  get mapSVG(){ return this._mapSVG; }
  get mapCanvas(){ return this._mapCanvas; }
  get unitCanvas(){ return this._unitCanvas; }
  get mapCtx(){ return this._mapCtx; }
  get canvasLength(){ return this._canvasLength; }
  get game(){return this.game;}
  get scene(){ return this.scene; }
  get annotationLayer(){ return this._annotationLayer; }

  handleDragStart(e){
    this._dragMode = true;
    this._dragStartXY = {x: e.x, y: e.y};
  }
  handleDragEnd(e){
    if (!this._dragMode) return;
    
    const {x, y, zoom} = this._transformAttributes;
    const dx = e.x - this._dragStartXY.x;
    const dy = e.y - this._dragStartXY.y;

    this._dragStartXY = {};
    this._dragMode = false;

    this._transformAttributes = { x: x + dx, y: y + dy, zoom};
    this.transform(this._transformAttributes, false);
  }
  handleDrag(e){
    if (!this._dragMode){
      let {x, y} = screenToMap(e, {
        translateX: this._transformAttributes?.x || 0,
        translateY: this._transformAttributes?.y || 0,
        zoom: this._transformAttributes?.zoom || 1
      });

      x = x | 0; y = y | 0;

      if (
        x !== this._highlightedGridXY.x || 
        y !== this._highlightedGridXY.y
      ) {
        this._highlightedGridXY = {x, y};
        this._mapSVG.updateHighlightedGrid({x, y});
      }
      return;
    };

    const {x, y, zoom} = this._transformAttributes;
    const dx = e.x - this._dragStartXY.x;
    const dy = e.y - this._dragStartXY.y;


    this._animationFrame = requestAnimationFrame( () => 
      this.transform({x: x + dx, y: y + dy, zoom}, false)
    );
  }

  handleScroll(e){
    const {x, y, zoom} = this._transformAttributes;
    const newZoom = Math.min(Math.max(1, zoom - e.deltaY / 64), 2);

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
    let {x, y} = mapToScreen(gameObject);

    this.transform({
      x: (window.innerWidth >> 1) + 128 - x,
      y: (window.innerHeight >> 1) - y,
      zoom: this._transformAttributes?.zoom || 1
    });

    SceneObject.focus(gameObject);
  }
}