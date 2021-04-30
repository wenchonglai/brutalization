import MetaAnnotation from "./meta-annotation.js";

export default class CityAnnotation extends MetaAnnotation{
  constructor(gameObject){
    super({
      gameObject,
      className: "annotation city-annotation",
      isOpaque: true
    }, '🏛 ', gameObject.name ?? '');
  }

  update(){
    MetaAnnotation.prototype.update.call(this);
    this.setStyles({
      zIndex: this.gameObject.x + this.gameObject.y + 1,
    });
  }
}