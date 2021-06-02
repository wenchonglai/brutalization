import MetaAnnotation from "./meta-annotation.js";

export default class CityAnnotation extends MetaAnnotation{
  constructor(gameObject){
    const {rural, urban, military} = gameObject.totalPopulations;

    super({
      gameObject,
      className: "annotation city-annotation",
      title: `Total Civilians: ${rural + urban}\nTotal Military: ${military}`,
      isOpaque: true
    }, '🏛 ', gameObject.name ?? '');
  }

  update(){
    MetaAnnotation.prototype.update.call(this);
    this.setStyles({
      zIndex: this.gameObject.x + this.gameObject.y + 1,
    });

    const {rural, urban, military} = this.gameObject.totalPopulations;

    this.setAttribute('title', 
      `Total Civilians: ${rural + urban}\nTotal Military: ${military}`
    )
  }
}