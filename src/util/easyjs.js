import EasyDOM from "./easy-dom.js";
import VirtualDOM from "./virtual-dom.js"

const EVENT_LISTENER_KEYS = [ "onCopy", "onCut", "onPaste", 
  "onCompositionEnd", "onCompositionStart", "onCompositionUpdate", 
  "onKeyDown", "onKeyPress", "onKeyUp", 
  "onFocus", "onBlur", 
  "onChange", "onInput", "onInvalid", "onReset", "onSubmit",  
  "onError", "onLoad", 
  "onClick", "onContextMenu", "onDoubleClick",  
  "onDrag", "onDragEnd", "onDragEnter", "onDragExit",
  "onDragLeave", "onDragOver", "onDragStart", "onDrop",  
  "onMouseDown", "onMouseEnter", "onMouseLeave",
  "onMouseMove", "onMouseOut", "onMouseOver", "onMouseUp", 
  "onPointerDown", "onPointerMove", "onPointerUp",
  "onPointerCancel", "onGotPointerCapture", 
  "onLostPointerCapture", "onPointerEnter", "onPointerLeave",
  "onPointerOver", "onPointerOut", 
  "onSelect", 
  "onTouchCancel", "onTouchEnd", "onTouchMove", "onTouchStart", 
  "onScroll", 
  "onWheel", 
  "onAbort", "onCanPlay", "onCanPlayThrough", "onDurationChange",
  "onEmptied", "onEncrypted", 
  "onEnded", "onError", "onLoadedData", "onLoadedMetadata",
  "onLoadStart", "onPause", "onPlay", 
  "onPlaying", "onProgress", "onRateChange",
  "onSeeked", "onSeeking", "onStalled", "onSuspend", 
  "onTimeUpdate", "onVolumeChange", "onWaiting", 
  "onLoad", "onError", 
  "onAnimationStart", "onAnimationEnd", "onAnimationIteration", 
  "onTransitionEnd", 
  "onToggle", 
];

let memoizedStates = new Map();
let index = 0;

export const useState = function(initialValue){
  let state;

  if (memoizedStates.has(index)) state = memoizedStates.get(index)
  else {
    state = initialValue;
    memoizedStates.set(index, initialValue);
  }

  const currIndex = index;

  const dispatch = value => {
    memoizedStates.set(currIndex, value);
    index = 0;

    requestAnimationFrame(() => {
      if (!this.parent){ return; }
      this.parent.removeChild(this.htmlElement);
      EasyDOM.render(new this.constructor(this.props), this.parent);
      delete this.parent;
      delete this.htmlElement;
    })
  }

  return [memoizedStates.get(index++), dispatch];
}

let memoizedEffects = new Map();
let effectIndex = 0;

export const useEffect = function(callback, arr){
  let oldArr;

  if (memoizedEffects.has(effectIndex)) 
    oldArr = memoizedEffects.get(effectIndex);
  else {
    oldArr = [];
    memoizedEffects.set(effectIndex, oldArr);
  }

  const currIndex = effectIndex;
  const oldLength = oldArr.length;
  const length = arr.length;
  
  if (oldLength !== length || oldArr.some((el, i) => el !== arr[i])){
    memoizedEffects.set(currIndex, arr);
    effectIndex = 0;

    requestAnimationFrame(() => {
      callback();
    });
  }

  effectIndex ++;
}

export default function createComponent(tagName, allProps = {}, ..._children){
  let {
    context,
    className = "", style = {}, children,
    ...props
  } = allProps;

  children ||= _children;

  // custom components
  if (!(typeof tagName === 'string')) return new tagName(allProps);
  
  let htmlElement;
  
  if (['svg', 'g', 'circle', 'rect', 'path'].includes(tagName))
    htmlElement = document.createElementNS("http://www.w3.org/2000/svg", tagName)
  else htmlElement = document.createElement(tagName);

  htmlElement.context = context;

  // add className
  if (className)
    try {
      htmlElement.className = className;
    } catch (e){
      htmlElement.className.baseVal = className;
    }
  
  for (let [key, value] of Object.entries(style))
    htmlElement.style[key] = typeof value === 'number' ? `${value}px` : value;
  
  // add eventlisteners
  EVENT_LISTENER_KEYS.map(key => {
    const func = props[key];
    delete props[key]; 
    
    if (typeof func === 'function')
      htmlElement.addEventListener(key.substring(2).toLowerCase(), func);
  });

  for (let key of Object.keys(props)){
    htmlElement.setAttribute(key, props[key]);
    try {
      htmlElement[key] = props[key];
    } catch (e){}
  }

  for (let child of children.flat(1)){
    child instanceof Object ?
      htmlElement.appendChild(
        child instanceof Element ? child : (
          child instanceof VirtualDOM ? child._dom :
            createComponent(...child)
        )
      ) : htmlElement.append(child)
  }

  return htmlElement;
}

