import VirtualDOM from "../util/virtual-dom.js";
import GridLayer from "./svg-layers/grid-layer.js";
import PathLayer from "./svg-layers/path-layer.js";

export default class MapSVG extends VirtualDOM{
  constructor({width, height}){
    super('svg');
    
    this._dom.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this._dom.style.width = String(width);
    this._dom.style.height = height;

    this.gridLayer = new GridLayer({width, height});
    this.pathLayer = new PathLayer({width, height});

    this.append(this.gridLayer, this.pathLayer);  
  }
  get svg(){ return this._dom; }

  updateHighlightedGrid({x, y}){
    this.gridLayer.highlight({x, y});
  }

  // moveDestinationIndicator(pos){
  //   if (!pos) this.gridLayer.hideDestinationIndicator();
  //   else this.gridLayer.moveDestinationIndicator(pos);
  // }

  resetPathFinder(pos, path, mode){
    this.pathLayer.updatePathfinder({x: -1, y: -1}, undefined, 'camp')
  }

  updatePathfinder(pos, path, mode){
    this.pathLayer.updatePathfinder(pos, path, mode)
  }

  setFormation(x, y){
    this.pathLayer.setFormation(x, y); 
  }

  reset(){
    // this.updateHighlightedGrid({x: -1, y: -1});
    this.updatePathfinder({x: -1, y: -1});
    this.setFormation(0, 0);
  }

  updateUnitIndicators(unit){
    this.pathLayer.updateUnitIndicators(unit);
  }
}