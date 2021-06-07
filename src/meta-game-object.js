export default class MetaGameObject{
  constructor({player, tile, state, ...args} = {}){
    this._state = {...state};
    this._actionQueue = [];
    this.campTile?.registerCamp(this);

    for (let key of Object.keys(args))
      this[`_${key}`] = args[key];

    this.register({player, tile});
  }

  get round(){
    return this.player.game.round;
  }
  
  register({player, tile}){
    tile?.register(this);
    player?.register(this);
  }

  deregister(){
    if (this.game?.gameObject === this)
      this.game.focus(Array.from(this.player._unresolved)[0]);

    this.tile?.deregister(this);
    this.player?.deregister(this);
  }

  saveAction(action){ 
    if (action)
      this._actionQueue[0] = action;
  }

  clearActions(){
    this._actionQueue = [];
  }
  
  dispatch(action, callback){
    if (!action) return;

    this.state = this.actionReducer(action);

    callback?.();

    this.player.update(this, action);
  }

  get game(){ return this.player.game; }
  get state(){ return this._state; }
  set state(newState){ return this._state = newState; }
  get tile(){ return this._tile; }
  get player(){ return this._player; }
  get playerId(){ return this._player?.id; }
  get x(){ return this.tile.x; }
  get y(){ return this.tile.y; }
  get actionQueue(){ return this._actionQueue; }
  get action(){ return this.actionQueue[0]; }
  get enemySpotted(){
    const enemies = new Set();

    for (let tile of this.tile.getAdjacentTiles())
      for (let unit of tile.units)
        if (unit.isEnemy(this) || unit.destination == this.tile)
          enemies.add(unit);

    return enemies.size > 0 ? enemies : false;
  }

  isEnemy(gameObject){ 
    return this.player.isEnemy(gameObject);
  }
  getClosestPathToOtherUnit({maxCostDistance = 15} = {}){
    return this.tile.bfs(
      tile => tile.hasOther(this),
      () => true,
      {maxCostDistance}
    );
  }
}