import createComponent from "../util/easyjs.js";
import VirtualDOM from "../util/virtual-dom.js";
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

class MapCanvas extends VirtualDOM{
  constructor({
    width, height, 
  }){
    super('canvas');

    this._ctx = this._dom.getContext('2d');
    this._dom.width = this.ctx.width = width;
    this._dom.height = this.ctx.height = height;

    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "#5f9f3f";
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.width / 2, this.height / 2);
    this.ctx.fillStyle = "green";
    this.ctx.fill();
  }

  get ctx(){ return this._ctx; }
  get width(){ return this.ctx.width; }
  get height(){ return this.ctx.height; }
}

export default class Renderer extends VirtualDOM{
  constructor({game}){
    super('div');

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

    this._isometricWrapper = createComponent('div', 
      {className: 'isometric-wrapper'},
      this._mapSVG, this.mapCanvas
    )

    this._dragStartXY = {};
    this._transformAttributes = {x: 0, y: 0, zoom: 1};
    this._highlightedGridXY = {};

    this.append(this._isometricWrapper);

    this.transform(this._transformAttributes);
  }

  get mapSVG(){ return this._mapSVG; }
  get mapCanvas(){ return this._mapCanvas; }
  get mapCtx(){ return this._mapCtx; }
  get canvasLength(){ return this._canvasLength; }
  get game(){return this.game;}
  get scene(){ return this.scene; }

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
    this.transform(this._transformAttributes);
  }
  handleDrag(e){
    if (!this._dragMode){
      let {x, y} = screenToMap(e, {
        translateX: this._transformAttributes.x,
        translateY: this._transformAttributes.y,
        zoom: this._transformAttributes.zoom
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

    this.transform({x: x + dx, y: y + dy, zoom});
  }
  handleScroll(e){
    const {x, y, zoom} = this._transformAttributes;
    const newZoom = Math.min(Math.max(1, zoom - e.deltaY / 64), 2);
    
    this._transformAttributes = {
      x: x * newZoom / zoom - e.x * (newZoom / zoom - 1),
      y: y * newZoom / zoom - e.y * (newZoom / zoom - 1),
      zoom: newZoom
    }

    this.transform(this._transformAttributes);
  }

  transform({x, y, zoom}){ 
    cancelAnimationFrame(this._animationFrame);

    this._animationFrame = requestAnimationFrame(() => {
      let transformString = [
        `translate(${x}px, ${y}px) scale(${zoom})`
      ].join(' ');
    
      this._dom.style.transform = transformString;
    });
  }

  addToScene(gameObject){
    let sceneObject = new SceneObject(gameObject);
  }
  removeFromScene(gameObject){
    
  }
}