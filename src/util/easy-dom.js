function render(component, parentNode){
  component.context.htmlElement = component;
  component.context.parent = parentNode;
  parentNode.appendChild(component);
};

function unmount(component, parentNode){
  if (component?.context){
    delete component.context.htmlElement;
    delete component.context.parent;
    delete component.context;
    
    try {
      component.parentNode?.removeChild(component)
    } catch(e){}
  }
}

const EasyDOM = {render, unmount};

export default EasyDOM;