export class Improvement{
  constructor({tile}){
    this._tile = tile;
  }

  get tile(){ return this._tile; }
  get x(){ return this.tile.x; }
  get y(){ return this.tile.y; }
}