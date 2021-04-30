import { mapToScreen } from "../../util/coordinate-converter.js";
import VirtualDOM from "../../util/virtual-dom.js";

export default class MetaAnnotation extends VirtualDOM{
  constructor({gameObject, className, isOpaque}, ...children){
    super('div', {
      className: `annotation${className ? ` ${className}` : ''}`,
      style: {
        backgroundColor: gameObject.player.color + (isOpaque ? 'bf' : '')
      },
      onClick: (e) => {
        gameObject.player.focus(gameObject);
      },
    }, ...children);

    this._gameObject = gameObject;

    this.update();
  }

  get gameObject(){ return this._gameObject; }

  update(){
    this.setStyles({
      zIndex: this.gameObject.x + this.gameObject.y,
    });

    const x = this.gameObject.x + 0.5;
    const y = this.gameObject.y + 0.5;
    const screenXY = mapToScreen({x, y});

    this._dom.style.left = screenXY.x;
    this._dom.style.top = screenXY.y;
  }
}