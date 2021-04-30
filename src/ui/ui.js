import "../util/string-patch.js";
import _, {useEffect, useState} from "../util/easyjs.js";
import EasyDOM from "../util/easy-dom.js";
import VirtualDOM from "../util/virtual-dom.js";

export default class UI extends VirtualDOM{
  constructor(game){
    super("div", {className: "ui"});

    this._informationPanel = new InformationPanel();
    this._commandsPanel = new CommandsPanel({game});
    this._resolveFunctions = new Map();
    this.append(this.informationPanel, this.commandsPanel);
  }

  get informationPanel(){ return this._informationPanel; }
  get commandsPanel(){ return this._commandsPanel; }
  get gameObject(){ return this._gameObject; }

  handleResolve(){
    const gameObject = this.gameObject;
    const player = gameObject?.player;
    const game = player?.game;
    const resolve = this._resolveFunctions.get(gameObject);
    const unresolved = player?._unresolved;

    if (!gameObject){
      resolve?.();
      return;
    }

    if (gameObject.tasked){
      resolve?.();
      this._resolveFunctions.delete(gameObject);

      if (unresolved){
        unresolved.delete(gameObject);
        const firstUnresolvedObject = Array.from(unresolved)[0];
        game.focus(
          firstUnresolvedObject, 
          this._resolveFunctions.get(firstUnresolvedObject)
        );
      }
    }
  }

  focus(gameObject, resolve){
    if (resolve) this._resolveFunctions.set(gameObject, resolve);
    this.update(gameObject);
  }

  update(gameObject){
    this._gameObject = gameObject;
    
    if (gameObject) this._player = gameObject.player;
    
    this._endable = !this._player._unresolved?.size;

    let { information, commands } = gameObject?.toUserInterface() || {};

    this.informationPanel.update(information);
console.log(gameObject)
    this.commandsPanel.update({
      commands, 
      selectedIndex: gameObject?.actionQueue[0]?.type,
      handleResolve: this.handleResolve.bind(this),
      endable: this._endable
    });
    
    EasyDOM.render(this, document.getElementById('game'));
  }
}

class InformationPanel extends VirtualDOM{
  constructor({data} = {}){
    super("div", {className: "info"},
      _("h3", {}, "Information"),
    );

    this.update(this._data = data);
  }

  get dataWrapper(){ return this._dataWrapper; }
  update(data = {}){
    this._data = data;
    this.remove(this.dataWrapper);
    this._dataWrapper = _("div", {className: "data-wrapper"},
      Object.keys(data).map(key => (
        _("div", {}, 
          _("div", {}, key),
          _("div", {}, data[key])
        )
      ))
    );
    this.append(this.dataWrapper);
  }
}

class CommandsPanel extends VirtualDOM{
  constructor({game}){
    super("div", {className: "commands-end-turn-wrapper"});

    this._game = game;
    this._commands = _("div", {className: "commands"});
    this._endTurnButton = _("a", {
      className: "end-turn",
      onClick: (e) => {
        game.endTurn();
      }
    }, "End Turn");
    this.append(this.commands, this.endTurnButton);

    this._selectedIndex = undefined;
  }

  get commands(){ return this._commands; }
  get endTurnButton(){ return this._endTurnButton; }
  
  update({commands, handleResolve, selectedIndex = false, endable}, 
    preserveSelectedIndex = false
  ){

    this.commands.innerHTML = "";

    if (!preserveSelectedIndex)
      this._selectedIndex = selectedIndex;

    commands && Object.entries(commands).map(([key, value]) => {
      let moveable = !!value;

      let childNode = _(IconButton, {
        id: key, selected: this._selectedIndex === key,
        command: value, handleResolve,
        moveable,
        handleClick: e => {
          this._selectedIndex = key;
          this.update({commands, handleResolve}, true);
        }
      });

      this.commands.appendChild(childNode);
    });

    this[endable ? "addClass" : "removeClass"]("endable");
    this.commands.classList[commands ? "remove" : "add"]("inactive");
  }
}

function IconButton({id, command, selected, handleClick, handleResolve, moveable}){
  const text = id.capitalize();
  const roughTextLength = text.length - 
    text.replace(/[^i^j^l^I]/g, '').length / 2;

  return (
    _("div", { context: this,
        className: `button command-button${
          moveable ? (selected ? ' selected' : '') : ' inactive'
        }`, 
        onClick: moveable ? (e) => {
          handleClick();

          const {skipResolve} = command() || {};
          skipResolve || handleResolve();
        } : null
      },
      _("a", { 
        title: text,
        style: { fontSize: Math.min(16, 70 / roughTextLength) } 
      }, text)
    )
  );
}