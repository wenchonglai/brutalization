# Brutalization

## Summary
Brutalization is a turn-based single player strategy board game that implements the logic of real wars and simulates marching and battles affected by logistics, morality, and formations. A user can compete against computer players, control units to attack enemy units, and eventually win the game by having higher scores or defeating other computer players.

## Technologies
- Redux-style game object states and actions
  - The game incorporates Redux-style stores and action dispatchers/reducers to control game object states and game events in an ES2018+ fashion.
    ```js
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

        this.player.update(this);
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
    ```
- Classes inheriting self-developed VirtualDOM class for ui
  - Per the project requirements, libraries such as React and Redux were not allowed. This game incorporated React-Style classes that allows for the creation, manipulation, and removal DOM nodes:
    ```js
    import createComponent from "./easyjs.js";

    export default class VirtualDOM{
      constructor(tagname, props, ...children){
        this._dom = createComponent(tagname, props, ...children);
      }

      get parentNode(){ return this._dom.parentNode; }

      append(...components){
        for (let component of components){
          this._dom.appendChild(
            component instanceof VirtualDOM ? 
              component._dom : component
          );
        }
      };

      remove(...components){
        for (let component of components){
          try {
            this._dom.removeChild(
              component instanceof VirtualDOM ? 
                component._dom : component
            )
          } catch(e){
            // console.warn(e)
          }
        }
      }

      attachTo(component){
        if (component instanceof VirtualDOM) component.append(this)
        else component.appendChild(this._dom);
      }

      detach(){
        this.parentNode?.removeChild(this._dom)
      }

      transform(transformString){
        this.style.transform = transformString;
      }

      listen(eventName, eventFunction){
        return this._dom.addEventListener(eventName, eventFunction, {passive: true});
      }
      unlisten(eventName, eventFunction){
        return this._dom.removeEventListener(eventName, eventFunction);
      }

      setStyle(key, value){ this._dom.style[key] = value; }
      setStyles(props){
        for (let entry of Object.entries(props))
          this.setStyle(...entry)
      }
      toggleClass(value){ this._dom.classList.toggle(value); }
      addClass(value){ this._dom.classList.add(value); }
      removeClass(value){ this._dom.classList.remove(value); }
    }

    export class VirtualCanvas extends VirtualDOM{
      constructor({
        width, height, imageSmoothingEnabled = false, ...props
      }){
        super('canvas', {...props, className: `canvas ${props.className || ''}`});

        this._ctx = this._dom.getContext('2d');
        this.ctx.imageSmoothingEnabled = imageSmoothingEnabled;
        this._dom.width = this.ctx.width = width;
        this._dom.height = this.ctx.height = height;
      }

      get ctx(){ return this._ctx; }
      get width(){ return this.ctx.width; }
      get height(){ return this.ctx.height; }

      _draw(contextMethod, args, {fill, stroke, ...props}){
        for (let [key, val] in Object.entries(props))
          this.ctx[key] = val;

        if (fill) this.ctx.fillStyle = fill;

        this.ctx.beginPath();
        this.ctx[contextMethod](...args);

        fill && this.ctx.fill();
        stroke && this.ctx.stroke();
      }

      rect({x, y, width, height, ...props}, save = true){
        save && this.ctx.save();
        this._draw("rect", [x, y, width, height], {...props});
        save && this.ctx.restore();
      }

      clearRect(x, y, width, height){
        this.ctx.clearRect(x, y, width, height);
      }

      circle({x, y, r, ...props}, save = true){
        save && this.ctx.save();
        this._draw("arc", [x, y, r, 0, Math.PI * 2], {...props});
        save && this.ctx.restore();
      }

      createImageData(...args){ return this.ctx.createImageData(...args); }
      getImageData(...args){ return this.ctx.getImageData(...args); }
      putImageData(...args){ return this.ctx.putImageData(...args); }
      drawImage(...args){ return this.ctx.drawImage(...args); }
    }
    ```
- Canvas and SVG layers for rendering

## MVP List
- MVP #1
  - A unit consumes move points to move, alert, or battle.
  - A unit can save and accumulate move points to the next turn.
  - When the destination tile has an enemy unit, the unit will enter a battle mode instead of moving into the tile.
- MVP #2
  - Hunger, tiredness, morality, formation, and experience altogether affect the overall military might of a unit.
  - The probability of winning relies on the relative military mights of the two opposing units in a battle.
  - A unit gains experience by marching (minimally) or enter into a battle.
- MVP #3
  - The game has a splash page with a "start game" button, as well as the main game page. The game board is visualized in an isometric view with each unit represented by a pin-like icon.
  - A user can control a unit using either mouse gestures or menu buttons.
  - The approximate information of a user-controlled unit will be indicated. The data of a computer-controlled unit or the exact data of a user-controlled unit will NOT be revealed.
- MVP #4
  - The computer player incorporates a bare minimum of AI and controls units. 
  - A computer-controlled unit can march/attack targeting a user unit.
  - A computer-controlled unit can recalculate the path and goals every turn.

## Timeline
- Apr 24 (Sat)
  - Conceptualize the game idea.
- Apr 25 (Sun)
  - Build game object classes. Incorporate BFS and a* algorithms for pathfinding.
- Apr 26 (Mon)
  - Complete the unit class with simulation calculations.
- Apr 27 (Tue)
  - Implement the overall rendering framework using Canvas and SVG.
- Apr 28 (Wed)
  - Design event listeners and/or menu buttons for user interactivity.
- Apr 29 (Thu)
  - Incorporate basic graphics.
- Apr 30 (Fri)
  - Incorporate basic AI
