import createComponent from "../../util/easyjs.js";
import MetaAnnotation from "./meta-annotation.js";

export default class UnitAnnotation extends MetaAnnotation{
  constructor(gameObject, className, icon, ...props){
    super(
      { gameObject,
        className: "unit-annotation"
      }, 
      createComponent("div", {className: "overlapping-emoji"}, 
        createComponent("div", {}, '🛡'),
        createComponent("div", {}, '🗡'),
      ),
      createComponent("div", {className: "casualty-indicator"}, 0)
    );
    
  }
  update(action){
    if (action?.type === 'battle'){
      const casualtyIndicator = this._dom.querySelector('.casualty-indicator');
      casualtyIndicator.classList.add('trigger');
      casualtyIndicator.innerHTML = action.casualty;

      setTimeout(() => {
        casualtyIndicator.classList.remove('trigger');
      }, 400);
      
      
      // casualtyIndicator.style.opacity = 0;
      
    }
    MetaAnnotation.prototype.update.call(this, action);
  }
}