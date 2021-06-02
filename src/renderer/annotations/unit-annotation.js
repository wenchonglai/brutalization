import createComponent from "../../util/easyjs.js";
import MetaAnnotation from "./meta-annotation.js";
import * as UnitActions from "../../actions/unit-actions.js";

export default class UnitAnnotation extends MetaAnnotation{
  constructor(gameObject, className, icon, ...props){
    super(
      { gameObject,
        className: "unit-annotation",
        title: `Total Units: ${gameObject.totalUnits}\nBattle Units: ${gameObject.battleUnits}`
      }, 
      createComponent("div", {className: "overlapping-emoji"}, 
        createComponent("div", {}, '🛡'),
        createComponent("div", {}, '🗡'),
      ),
      createComponent("div", {className: "casualty-indicator"}, 0)
    );
    
  }

  update(action){
    if (action?.type === UnitActions.BATTLE){
      const casualtyIndicator = this._dom.querySelector('.casualty-indicator');
      casualtyIndicator.classList.add('trigger');
      casualtyIndicator.innerHTML = action.casualty;

      setTimeout(() => {
        casualtyIndicator.classList.remove('trigger');
      }, 400);
    }

    this.setAttribute('title', 
      `Total Units: ${this.gameObject.totalUnits}\nBattle Units: ${this.gameObject.battleUnits}`
    );
    
    MetaAnnotation.prototype.update.call(this, action);
  }
}