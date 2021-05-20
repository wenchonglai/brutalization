export default class MetaGameObject{
  constructor({player, tile, state}){
    this._state = {...state};
    this._actionQueue = [];
    this.campTile?.registerCamp(this);
    this.register({player, tile});
  }
  
  register({player, tile}){
    tile?.register(this);
    player?.register(this);
  }

  deregister(){
    if (this.game.gameObject === this)
      this.game.focus(Array.from(this.player._unresolved)[0]);

    this.tile?.deregister(this);
    this.player?.deregister(this);
  }

  saveAction(action){ 
    if (action)
      this._actionQueue[0] = action;
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
}