import MetaAnnotation from "./meta-annotation.js";

export default class CityAnnotation extends MetaAnnotation{
  constructor(gameObject){
    super({
      gameObject,
      className: "annotation city-annotation",
      isOpaque: true
    }, '🏘 ', gameObject.name ?? '');
  }
}