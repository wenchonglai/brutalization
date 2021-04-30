import MetaAnnotation from "./meta-annotation.js";

export default class UnitAnnotation extends MetaAnnotation{
  constructor(gameObject, className, icon, ...props){
    super({
      gameObject,
      className: "unit-annotation"
    }, '🪖');
  }
}