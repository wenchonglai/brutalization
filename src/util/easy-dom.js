function render(component, parentNode){
  component.context.htmlElement = component;
  component.context.parent = parentNode;
  parentNode.appendChild(component);
};

const EasyDOM = {render};

export default EasyDOM;