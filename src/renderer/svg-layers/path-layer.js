import VirtualDOM from "../../util/virtual-dom.js";
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

    this._destinationIndicator = createComponent('g', {
        transform: "translate(-64, -64)"
      },
      createComponent('circle', { 
        r: 22,
        fill: "none",
        "stroke-width": 3,
        width: PIXEL_PER_GRID, height: PIXEL_PER_GRID
      }),
    );

    this._formationIndicator = createComponent('path', { 
      d: "M -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0",
      fill: "#ffffff",
    });

    this._pathFinder = createComponent('path', {
      stroke: "#ffffff", fill: "none", 
      "stroke-width": 6, d: "",
      "stroke-dasharray": "3 3"
    });
    
    this.destinationIndicator.appendChild(this.formationIndicator);
    this.append(this.destinationIndicator);
    this.append(this.pathFinder);
  }

  get destinationIndicator(){ return this._destinationIndicator; }
  get highlightedGrid(){ return this._highlightedGrid; }
  get pathFinder(){ return this._pathFinder; }
  get formationIndicator(){ return this._formationIndicator; }

  _moveDestinationIndicator({x, y}, path, mode="camp"){
    let rotateString = this.destinationIndicator.getAttribute('transform')
      .replace(/translate\([^\(^\)]*\)\s*/g, '');

    this._move(this.destinationIndicator, {
      transform: `translate(${(x + 0.5) * PIXEL_PER_GRID}, ${(y + 0.5) * PIXEL_PER_GRID}) ${rotateString}`
    });

    const color = PATHFINDER_COLORS[mode];
    this.destinationIndicator.setAttribute("stroke", path ? color : "#7f7f7fdf");
    this.formationIndicator.setAttribute("fill", path ? color : "#7f7f7fdf");
  }
  hideDestinationIndicator(){
    this._move(this.destinationIndicator, {
      transform: `translate(-64, -64)`
    })
  }
  setFormation(x, y){
    let transformString = this.destinationIndicator
      .getAttribute("transform")
      .replace(/\ *rotate\([^\(^\)]*\)\ */, '');

    if (x === 0 && y === 0){
      this.formationIndicator.setAttribute(
        "d", "M -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0"
      );
    } else {
      this.formationIndicator.setAttribute(
        "d", "M -8 -22 L 8 -22 L 0 -30 L -8 -22",
      );
      this.destinationIndicator.setAttribute(
        "transform",
        `${transformString} rotate(${Math.atan2(x, -y) * 180 / Math.PI})`
      );
    }
  }
  updatePathfinder(pos, path, mode = "camp"){
    this._moveDestinationIndicator(pos, path, mode);

    if (!path || path.length < 2){
      this.pathFinder.setAttribute("d", "");
      return;
    }

    let length = path.length;
    let pathArr = path.map(({x, y}) => ({
      x: (x + 0.5)* PIXEL_PER_GRID | 0, 
      y: (y + 0.5) * PIXEL_PER_GRID | 0
    }));
    
    const stringArr = pathArr.map(({x, y}, i) => {
      if (i === 0){
        return `M ${x} ${y} Q ${x} ${y}`
      } else {
        let lastXY = pathArr[i - 1];
        const _x = x + lastXY.x >> 1;
        const _y = y + lastXY.y >> 1;

        if (i === length - 1){
          const xDiff = x > _x ? 1 : x === _x ? 0 : -1;
          const yDiff = y > _y ? 1 : y === _y ? 0 : -1;
          const coefficient = 1 / ((xDiff ** 2 + yDiff ** 2) ** 0.5);
          x -= xDiff * 32 * coefficient;
          y -= yDiff * 32 * coefficient;

          x |= 0;
          y |= 0;
        }

        return `${_x} ${_y} Q ${x} ${y}${i === length - 1 ? ` ${x} ${y}` : ''}`
      }
    });
    const pathString = stringArr.join(' ');

    this.pathFinder.setAttribute("d", pathString);
    this.pathFinder.setAttribute("stroke", PATHFINDER_COLORS[mode]);
  }
}