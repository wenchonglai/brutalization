import MetaAnnotation from "./meta-annotation.js";

export default class CityAnnotation extends MetaAnnotation{
  constructor(gameObject){
    const {rural, urban, military} = gameObject.totalPopulations;
    const player = gameObject.player;
    const humanPlayer = gameObject.game.players[0];
    const attitude = player.attitudes.get(humanPlayer) || 0;

    super(
      { gameObject,
        className: "annotation city-annotation",
        title: `Total Civilians: ${rural + urban}\nTotal Military: ${military}`,
        isOpaque: true
      }
    );

    this._content = `${player === humanPlayer ? '🏛' : (attitude >= 0 ? '🙂' : '😡')}${gameObject.isCapital ? '⭐️' : ''}${gameObject.name ?? ''}`;
  }

  get content(){ return this._content; }

  update(){
    const gameObject = this.gameObject;
    const player = gameObject.player;
    const humanPlayer = gameObject.game.players[0];
    const attitude = player.attitudes.get(humanPlayer) ?? 0;

    MetaAnnotation.prototype.update.call(this);
    this.setStyles({
      zIndex: gameObject.x + gameObject.y + 1,
    });

    const {rural, urban, military} = gameObject.totalPopulations;

    this.setAttribute('title', 
      `Total Civilians: ${rural + urban}\nTotal Military: ${military}`
    );

    this.setContent(
      `${player === humanPlayer ? '🏛' : (
        attitude > 0 ? '🤝' : attitude === 0 ? '🤝' : '⚔️')}${gameObject.isCapital ? '⭐️' : ''
      }${gameObject.name ?? ''}`
    );
  }

  setContent(content){
    this.annotation.innerHTML = content;
  }
}