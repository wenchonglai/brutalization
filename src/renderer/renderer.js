import createComponent from "../util/easyjs.js";
import VirtualDOM, { VirtualCanvas } from "../util/virtual-dom.js";
import {screenToGrid, mapToScreen} from "../util/coordinate-converter.js";
import SceneObject from "./scene-object.js";
import MapSVG from "./map-svg.js";
import {PIXEL_PER_GRID, MIN_ZOOM, MAX_ZOOM} from "../settings/map-settings.js";
import {marchEventListeners, raidEventListeners} from "./interactions/move.js";
import Texture from "./texture.js";

class MapCanvas extends VirtualCanvas{
  constructor({renderer, ...props}){
    super({...props, className: "map-canvas"});
    this._renderer = this;

    this.rect({x: 0, y: 0, width: this.width, height: this.height, fill: "#7f974f"});
  }
  
  get renderer(){ return this._renderer; }
}

class UnitCanvas extends VirtualCanvas{
  constructor({renderer, ...props}){
    super({...props, className: "unit-canvas"});
    this._renderer = this;
  }

  get renderer(){ return this._renderer; }
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
    this._texture = new Texture(document.getElementById('improvements'));

    const length = game.mapSize * PIXEL_PER_GRID;

    this._mapSVG = new MapSVG({width: length, height: length, renderer: this});
    this._mapCanvas = new MapCanvas({width: length, height: length, renderer: this});
    this._unitCanvas = new UnitCanvas({width: length, height: length, renderer: this});

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

    document.addEventListener('keydown', (e) => {
      switch (e.key){
        case 'ArrowDown': this.scroll(0, -1, e.shiftKey); break;
        case 'ArrowUp': this.scroll(0, 1, e.shiftKey); break;
        case 'ArrowLeft': this.scroll(1, 0, e.shiftKey); break;
        case 'ArrowRight': this.scroll(-1, 0, e.shiftKey); break;
        case 'Escape': {this.eventListeners.mouseleave()}; break;
      }
    });
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
  get texture(){ return this._texture; }

  scroll(dx, dy, shiftKey){
    const {x, y, zoom} = this.transformAttributes;
    const coefficient = shiftKey ? 50 : 5;

    this.transform({
      x: x + dx * zoom * coefficient, 
      y: y + dy * zoom * coefficient, 
      zoom
    });
  }

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

  appendAnnotation(annotation){
    this.annotationLayer.append(annotation);
  }

  focus(gameObject){
    if (gameObject){
      this._gameObject = gameObject;
    }

    if (gameObject){
      const {x, y} = mapToScreen(gameObject);
      const zoom = this._transformAttributes?.zoom ?? 1;

      this.mapSVG.reset();

      this.transform({
        x: (window.innerWidth >> 1) + 128 - x * zoom,
        y: (window.innerHeight >> 1) - y * zoom,
        zoom
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
  _drawImage(ctx, tile, type){
    let {x, y} = tile;

    ctx.drawImage(
      ...this.texture.getTextureArgs(type),
      x * PIXEL_PER_GRID, y * PIXEL_PER_GRID,
      PIXEL_PER_GRID, PIXEL_PER_GRID
    );
  }
  _renderCity(tile){
    if (tile.city) { this._drawImage(this.mapCanvas, tile, 'city'); }
  }
  _renderFarm(tile){
    if (tile.improvements.has('farm')){
      const isEven = (tile.x + tile.y) % 2 === 0;
      this._drawImage(this.mapCanvas, tile, isEven ? 'farm1' : 'farm2');
    }
    
  }
  _renderCamp(tile){
    if (tile.camp && !tile.city)
      this._drawImage(this.unitCanvas, tile, 'camp');
  };
  _renderFormation(tile){
    let unit = Array.from(tile.units)[0];

    if (!unit) return;

    const {battleUnits, x, y, campTile, formation, isDenselyFormed} = unit;
    const legions = battleUnits / 250 | 0;
    const normalCols = isDenselyFormed ? Math.ceil(legions ** 0.5) : 12;
    const rows = Math.ceil(legions / normalCols);
    const residualCols = legions % normalCols;
    this._x = x * PIXEL_PER_GRID;
    this._y = y * PIXEL_PER_GRID;

    const imageData = this.unitCanvas.getImageData(
      this._x, this._y, PIXEL_PER_GRID, PIXEL_PER_GRID
    );
    const buffer = new Uint32Array(imageData.data.buffer);
    const angle = Math.atan2(...formation);
    const COS = Math.round(Math.cos(angle));
    const SIN = Math.round(Math.sin(angle));
    const GAP = (COS !== 0 && SIN !== 0 || isDenselyFormed) ? 2 : 3;

    for (let row = 0; row < rows; row++){
      let cols = row === (rows - 1) ? (residualCols || normalCols) : normalCols;

      for (let col = 0; col < cols; col++){
        const px0 = rows * GAP / (isDenselyFormed ? 2 : 1) - (row + 1) * GAP;
        const py0 = -cols * GAP / 2 + col * GAP;
        const px = PIXEL_PER_GRID / 2 + Math.round(px0 * COS - py0 * SIN);
        const py = PIXEL_PER_GRID / 2 + Math.round(px0 * SIN + py0 * COS);

        const index = (px * PIXEL_PER_GRID + py);

        buffer[index] = 255 << 24;
      }
    }

    this.unitCanvas.putImageData(imageData, this._x, this._y);
  }

  _clear({x, y}){
    window.mapCanvas = this.mapCanvas;
    this.mapCanvas.clearRect(
      x * PIXEL_PER_GRID, y * PIXEL_PER_GRID, PIXEL_PER_GRID, PIXEL_PER_GRID
    );
    this.unitCanvas.clearRect(
      x * PIXEL_PER_GRID, y * PIXEL_PER_GRID, PIXEL_PER_GRID, PIXEL_PER_GRID
    );
  }

  _renderNature({x, y}){
    this.mapCanvas.rect({
      x: x * PIXEL_PER_GRID, y: y * PIXEL_PER_GRID, 
      width: PIXEL_PER_GRID, height: PIXEL_PER_GRID, fill: "#7f974f"
    });
  }

  render(tile){
    if (!tile) return;
    this._clear(tile);
    this._renderNature(tile);
    this._renderFarm(tile);
    this._renderCity(tile);
    this._renderCamp(tile);
    this._renderFormation(tile);
  }
}