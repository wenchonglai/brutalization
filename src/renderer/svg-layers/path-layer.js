import VirtualDOM, { SVGPath } from "../../util/virtual-dom.js";
import createComponent from "../../util/easyjs.js";
import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaLayer from "./meta-layer.js";

const PATHFINDER_COLORS = {
  camp: "#ffffff",
  action: "#ffdf00",
  attack: "#df0000",
}

export default class PathLayer extends MetaLayer{
  constructor(){
    super('g', {className: 'path'});

    this._destinationSelector = new VirtualDOM('g', {
        transform: "translate(-64, -64)"
      },
      createComponent('circle', { 
        r: 22,
        fill: "none",
        "stroke-width": 3,
        width: PIXEL_PER_GRID, height: PIXEL_PER_GRID
      }),
    );

    this._formationSelector = new SVGPath({ 
      d: "M -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0",
      fill: "#ffffff",
    });

    this._pathFinder = new SVGPath({
      stroke: "#ffffff", fill: "none", 
      "stroke-width": 6, d: "",
      "stroke-dasharray": "3 3",
      includeOrigin: false
    });

    this._logisticsIndicator = new SVGPath({
      stroke: "#03ff9e", fill: "none",
      "stroke-width": 1, d: "",
    });

    this._pathToCampIndicator = new SVGPath({
      stroke: "#ffea3b", fill: "none",
      "stroke-width": 1, d: "",
    });

    this._destinationIndicator = new SVGPath({
      stroke: "#ffea3b", fill: "none",
      "stroke-width": 1, d: "",
    });
    
    this.destinationSelector.append(this.formationSelector);

    this.append(
      this.destinationSelector,
      this.logisticsIndicator,
      this.pathToCampIndicator,
      this.destinationIndicator,
      this.pathFinder
    );
  }

  get destinationSelector(){ return this._destinationSelector; }
  get highlightedGrid(){ return this._highlightedGrid; }
  get pathFinder(){ return this._pathFinder; }
  get formationSelector(){ return this._formationSelector; }
  get pathToCampIndicator(){ return this._pathToCampIndicator; }
  get logisticsIndicator(){ return this._logisticsIndicator; }
  get militaryActionIndicator(){ return this._militaryActionIndicator; }
  get destinationIndicator(){ return this._destinationIndicator; }

  _moveDestinationSelector({x, y}, path, mode="camp"){
    let rotateString = this.destinationSelector.getAttribute('transform')
      .replace(/translate\([^\(^\)]*\)\s*/g, '');

    this.setAttributes(this.destinationSelector, {
      transform: `translate(${(x + 0.5) * PIXEL_PER_GRID}, ${(y + 0.5) * PIXEL_PER_GRID}) ${rotateString}`
    });

    const color = path ? PATHFINDER_COLORS[mode] : "#7f7f7fdf";

    this.destinationSelector.setAttribute("stroke", color);
    this.formationSelector.setAttribute("fill", color);
  }
  hideDestinationSelector(){
    this.setAttributes(this.destinationSelector, {
      transform: `translate(-64, -64)`
    })
  }
  setFormation(x, y){
    let transformString = this.destinationSelector
      .getAttribute("transform")
      .replace(/\ *rotate\([^\(^\)]*\)\ */, '');

    if (x === 0 && y === 0){
      this.formationSelector.setAttribute(
        "d", "M -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0"
      );
    } else {
      this.formationSelector.setAttribute(
        "d", "M -8 -22 L 8 -22 L 0 -30 L -8 -22",
      );
      this.destinationSelector.setAttribute(
        "transform",
        `${transformString} rotate(${Math.atan2(x, -y) * 180 / Math.PI})`
      );
    }
  }
  updatePathfinder(pos, path, mode = "camp"){
    this._moveDestinationSelector(pos, path, mode);
    this.pathFinder.setPath(path, function(){ this.setAttribute("stroke", PATHFINDER_COLORS[mode]); } );
  }

  updateUnitIndicators(unit){
    this.logisticsIndicator.setPath(unit.pathToClosestHomeCityFromCamp);
    this.pathToCampIndicator.setPath(unit.pathToCamp)
  }
}