import createComponent from "./easyjs.js";
import {PIXEL_PER_GRID} from "../settings/map-settings.js";

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
  getAttribute(...args){ return this._dom.getAttribute(...args); }
  setAttribute(...args){ return this._dom.setAttribute(...args); }
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

  clearRect(x, y, width, height){
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

export class SVGPath extends VirtualDOM{
  constructor({includeOrigin = true, bezier = true, color, arrow = false, ...args} = {}, ...children){
    const path = createComponent('path', {stroke: color, fill: "none", ...args});
    const nodes = createComponent('g', {stroke: "none", fill: color, ...args, "stroke-dasharray": "none"});

    super('g', {}, path);

    this._path = path;
    this._nodes = nodes;
    this._color = color;
    this._includeOrigin = includeOrigin;
    this._bezier = bezier;
    this._arrow = arrow;

    bezier || this.append(nodes);
  }
  get path(){ return this._path; }
  get nodes(){ return this._nodes; }
  get color(){ return this._color; }
  get includeOrigin(){ return this._includeOrigin; }
  get bezier(){ return this._bezier; }
  get arrow(){ return this._arrow; }
  
  setPath(path, callback){
    this.nodes.innerHTML = '';
    callback?.call(this);

    if (!path || path.length < 2){
      this.path.setAttribute("d", "");
      return;
    }

    const length = path.length;
    const pathArr = path.map(({x, y}) => ({
      x: (x + 0.5)* PIXEL_PER_GRID | 0, 
      y: (y + 0.5) * PIXEL_PER_GRID | 0
    }));  
    const pathCommand = this.bezier ? 'Q' : 'L';

    const stringArr = pathArr.map(({x, y}, i) => {
      if (!this.bezier) 
        this.nodes.append(createComponent('circle', {cx: x, cy: y, r: 3}));

      if (i === 0){
        return `M ${x} ${y} ${pathCommand} ${x} ${y}`
      } else {
        let lastXY = pathArr[i - 1];
        const _x = x + lastXY.x >> 1;
        const _y = y + lastXY.y >> 1;
        const dx = x - lastXY.x;
        const dy = y - lastXY.y;
        const angle = Math.atan2(-dx, dy) * 180 / Math.PI;

        this.arrow && this.nodes.append(
          createComponent('path', {
            d: `M -5 -5 L 0 0 L 5 -5`,
            transform: `translate(${_x}, ${_y}) rotate(${angle})`,
            fill: "none", stroke: this.color, 'stroke-width': 2
          })
        );

        if (i === length - 1){
          const xDiff = x > _x ? 1 : x === _x ? 0 : -1;
          const yDiff = y > _y ? 1 : y === _y ? 0 : -1;
          const coefficient = 1 / ((xDiff ** 2 + yDiff ** 2) ** 0.5);
          const ratio = this.includeOrigin ? 0 : PIXEL_PER_GRID / 2;

          x -= xDiff * ratio * coefficient;
          y -= yDiff * ratio * coefficient;

          x |= 0;
          y |= 0;
        }

        return `${_x} ${_y} ${pathCommand} ${x} ${y}${i === length - 1 ? ` ${x} ${y}` : ''}`
      }
    });
    const pathString = stringArr.join(' ');

    this.path.setAttribute("d", pathString);
  }

  setAttribute(key, val){
    if (key === 'color'){
      this._color = val;
      this.path?.setAttribute('stroke', val);
      this.nodes?.setAttribute('fill', val);
    } else {
      VirtualDOM.prototype.setAttribute.call(this, key, val);
    }
  }
}