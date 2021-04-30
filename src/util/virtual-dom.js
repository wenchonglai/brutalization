import createComponent from "./easyjs.js";

export default class VirtualDOM{
  constructor(tagname, props, ...children){
    this._dom = createComponent(tagname, props, ...children);
  }

  get parentNode(){ return this._dom.parentNode; }

  append(...components){
    for (let component of components){
      this._dom.appendChild(
        component instanceof VirtualDOM ? 
          component._dom : component
      );
    }
  };

  remove(...components){
    for (let component of components){
      try {
        this._dom.removeChild(
          component instanceof VirtualDOM ? 
            component._dom : component
        )
      } catch(e){
        // console.warn(e)
      }
    }
  }

  attachTo(component){
    if (component instanceof VirtualDOM) component.append(this)
    else component.appendChild(this._dom);
  }

  detach(){
    this.parentNode?.removeChild(this._dom)
  }

  transform(transformString){
    this.style.transform = transformString;
  }

  listen(eventName, eventFunction){
    return this._dom.addEventListener(eventName, eventFunction, {passive: true});
  }
  unlisten(eventName, eventFunction){
    return this._dom.removeEventListener(eventName, eventFunction);
  }

  setStyle(key, value){ this._dom.style[key] = value; }
  setStyles(props){
    for (let entry of Object.entries(props))
      this.setStyle(...entry)
  }
  toggleClass(value){ this._dom.classList.toggle(value); }
  addClass(value){ this._dom.classList.add(value); }
  removeClass(value){ this._dom.classList.remove(value); }
}

export class VirtualCanvas extends VirtualDOM{
  constructor({
    width, height, imageSmoothingEnabled = false, ...props
  }){
    super('canvas', {...props, className: `canvas ${props.className || ''}`});

    this._ctx = this._dom.getContext('2d');
    this.ctx.imageSmoothingEnabled = imageSmoothingEnabled;
    this._dom.width = this.ctx.width = width;
    this._dom.height = this.ctx.height = height;
  }

  get ctx(){ return this._ctx; }
  get width(){ return this.ctx.width; }
  get height(){ return this.ctx.height; }

  _draw(contextMethod, args, {fill, stroke, ...props}){
    for (let [key, val] in Object.entries(props))
      this.ctx[key] = val;
    
    if (fill) this.ctx.fillStyle = fill;

    this.ctx.beginPath();
    this.ctx[contextMethod](...args);

    fill && this.ctx.fill();
    stroke && this.ctx.stroke();
  }

  rect({x, y, width, height, ...props}, save = true){
    save && this.ctx.save();
    this._draw("rect", [x, y, width, height], {...props});
    save && this.ctx.restore();
  }

  clearRect({x, y, width, height}){
    this.ctx.clearRect(x, y, width, height);
  }

  circle({x, y, r, ...props}, save = true){
    save && this.ctx.save();
    this._draw("arc", [x, y, r, 0, Math.PI * 2], {...props});
    save && this.ctx.restore();
  }

  createImageData(...args){ return this.ctx.createImageData(...args); }
  getImageData(...args){ return this.ctx.getImageData(...args); }
  putImageData(...args){ return this.ctx.putImageData(...args); }
  drawImage(...args){ return this.ctx.drawImage(...args); }
}