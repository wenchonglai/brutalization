import createComponent from "./easyjs.js";

export default class VirtualDOM{
  constructor(tagname, props){
    this._dom = createComponent(tagname, props);
  }

  append(component){
    this._dom.appendChild(
      component instanceof VirtualDOM ? 
        component._dom :
        component
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
}