import VirtualDOM from "../../util/virtual-dom.js";
import createComponent from "../../util/easyjs.js";
import {PIXEL_PER_GRID} from "../../settings/map-settings.js";

export default class MetaLayer extends VirtualDOM{
  constructor(tagName, {className}){
    super(tagName, {className: `layer${className ? ` ${className}` : ''}`});
  }

  setAttributes(obj, props){
    for (let [key, val] of Object.entries(props))
      obj.setAttribute(key, val);
  };
}