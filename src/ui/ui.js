import "../util/string-patch.js";
import _, {useEffect, useState} from "../util/easyjs.js";
import EasyDOM from "../util/easy-dom.js";

export default class UI{
  constructor(){
    this._resolveFunctions = new Map();
  }

  render(gameObject, res){
    this._focus = gameObject;
    this._resolveFunctions.set(gameObject, res);
    this.update(gameObject);
  }

  update(gameObject, res){
    if (this._focus === gameObject){
      EasyDOM.unmount(this._dom, document.getElementById('game'));
      this._dom = new UIComponent({
        gameObject, 
        res: this._resolveFunctions.get(gameObject),
      });
      EasyDOM.render(this._dom, document.getElementById('game'));
    }
  }
}

function IconButton(props = {}){
  const {id, data, selected, onClick} = props;
  const text = id.capitalize();
  const roughTextLength = text.length - 
    text.replace(/[^i^j^l^I]/g, '').length / 2;
  
  return (
    _("div", { context: this,
        className: `button command-button${selected ? ' selected' : ''}`, 
        onClick: (e) => data()
      },
      _("a", { 
        title: text,
        style: { fontSize: Math.min(16, 70 / roughTextLength) } 
      }, text)
    )
  );
}

function InformationPanel({data} = {}){
  return (
    _("div", {className: "info"},
      _("h3", {}, "Information"),
      Object.keys(data).map(key => (
        _("div", {}, 
          _("div", {}, key),
          _("div", {}, data[key])
        )
      ))
    )
  );
}

function UIComponent(props = {}){
  this.props = props;

  const { gameObject, res } = props;
  const { information, commands } = gameObject.toUserInterface();
  const [_selectedIndex, _setSelectedIndex] = useState.call(this);

  return (
    _("div", {className: "ui", context: this},
      _(InformationPanel, {className: "info", data: information}),
      _("div", {className: "commands-end-turn-wrapper"}, 
        _("div", {className: "commands"},
          Object.keys(commands).map(key => _(IconButton, {
            id: key, selected: _selectedIndex === key,
            data: commands[key], res,
            onClick: e => {_setSelectedIndex(key);}
          })),
        ),

        _("a", {className: "end-turn"}, "End Turn")
      )
    )
  );
}

window.UIComponent = UIComponent;