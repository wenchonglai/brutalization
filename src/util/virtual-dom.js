import createComponent from "./easyjs.js";

export default class VirtualDOM{
  constructor(tagname, props, ...children){
    this._dom = createComponent(tagname, props, ...children);
  }

  append(component){
    this._dom.appendChild(
      component instanceof VirtualDOM ? 
        component._dom : component
    );
  };

  attachTo(component){
    if (component instanceof VirtualDOM) component.append(this)
    else component.appendChild(this._dom);
  }

  transform(transformString){
    this.style.transform = transformString;
  }

  listen(eventName, eventFunction){
    return this._dom.addEventListener(eventName, eventFunction);
  }
  unlisten(eventName, eventFunction){
    return this._dom.removeEventListener(eventName, eventFunction);
  }

  setStyle(key, value){ this._dom.style[key] = value; }
  toggleClass(value){ this._dom.classList.toggle(value); }
  addClass(value){ this._dom.classList.add(value); }
  removeClass(value){ this._dom.classList.remove(value); }
}

export class VirtualCanvas extends VirtualDOM{
  constructor({
    width, height, ...props
  }){
    super('canvas', {...props, className: `canvas ${props.className || ''}`});

    this._ctx = this._dom.getContext('2d');
    this._dom.width = this.ctx.width = width;
    this._dom.height = this.ctx.height = height;
  }

  get ctx(){ return this._ctx; }
  get width(){ return this.ctx.width; }
  get height(){ return this.ctx.height; }

  _draw(contextMethod, args, {fill, ...props}){
    for (let [key, val] in Object.entries(props))
      this.ctx[key] = val;
    
    if (fill) this.ctx.fillStyle = fill;

    this.ctx.beginPath();
    this.ctx[contextMethod](...args);

    fill && this.ctx.fill();
    this.ctx.lineWidth > 0 && this.ctx.stroke();
  }

  rect({x, y, width, height, ...props}, save = true){
    save && this.ctx.save();
    this._draw("rect", [x, y, width, height], {...props});
    save && this.ctx.restore();
  }

  circle({x, y, r, ...props}, save = true){
    save && this.ctx.save();
    this._draw("arc", [x, y, r, 0, Math.PI * 2], {...props});
    save && this.ctx.restore();
  }
}