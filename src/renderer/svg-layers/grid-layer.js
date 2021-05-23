import createComponent from "../../util/easyjs.js";
import {PIXEL_PER_GRID} from "../../settings/map-settings.js";
import MetaLayer from "./meta-layer.js";

const PATHFINDER_COLORS = {
  camp: "#ffffff",
  action: "#ffdf00",
  attack: "#df0000",
}

export default class GridLayer extends MetaLayer{
  constructor({width, height
  }){
    super('g', {className: "grid"});

    for (let i = 0; i < width; i += PIXEL_PER_GRID)
      this.append( 
        createComponent('path', {
          d: `M ${i} 0 L ${i} ${height}`,
          stroke: "#0000001f",
        })
      );

    for (let i = 0; i < height; i += PIXEL_PER_GRID)
      this.append( 
        createComponent('path', {
          d: `M 0 ${i} L ${width} ${i}`,
          stroke: "#0000001f",
        })
      );
    
    // this._highlightedGrid = createComponent('rect', {
    //   stroke: "#00df3f", fill: "#00df3f1f",
    //   "stroke-width": 3,
    //   width: PIXEL_PER_GRID, height: PIXEL_PER_GRID
    // });
  }

  get highlightedGrid(){ return this._highlightedGrid; }

  moveGrid({x, y}){ this.setAttributes(this.highlightedGrid, {x, y}); }
}