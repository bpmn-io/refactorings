const HIGHEST_PRIORITY = 100000;

export default class CommandStackPreview {
  constructor(commandStack, eventBus, graphicsFactory, elementRegistry) {
    this._commandStack = commandStack;
    this._eventBus = eventBus;
    this._graphicsFactory = graphicsFactory;
    this._elementRegistry = elementRegistry;

    this._lastCommandStackIndex = null;

    this._elementsChanged = [];

    this.handleCommandStackChanged = this.handleCommandStackChanged.bind(this);
    this.handleElementsChanged = this.handleElementsChanged.bind(this);
    this.handleRender = this.handleRender.bind(this);
  }

  /**
   * Enables the preview.
   */
  enable() {
    this._lastCommandStackIndex = this._commandStack._stackIdx;

    this._eventBus.on('commandStack.changed', HIGHEST_PRIORITY, this.handleCommandStackChanged);
    this._eventBus.on('elements.changed', HIGHEST_PRIORITY, this.handleElementsChanged);
    this._eventBus.on([
      'render.shape',
      'render.connection',
    ], HIGHEST_PRIORITY, this.handleRender);
  }

  /**
   * Disables the preview. Undoes the previewed commands by default.
   */
  disable(undo = true) {
    this._eventBus.off('commandStack.changed', this.handleCommandStackChanged);
    this._eventBus.off('elements.changed', this.handleElementsChanged);
    this._eventBus.off([
      'render.shape',
      'render.connection',
    ], this.handleRender);

    this._elementsChanged.forEach(element => {
      if (isConnection(element)) {
        this._graphicsFactory.update('connection', element, this._elementRegistry.getGraphics(element));
      } else {
        this._graphicsFactory.update('shape', element, this._elementRegistry.getGraphics(element));
      }
    });

    this._elementsChanged = [];

    if (!undo) {
      return;
    }

    while (this._lastCommandStackIndex < this._commandStack._stackIdx) {
      this._commandStack.undo();
    }
  }

  handleCommandStackChanged(context) {
    // event.stopPropagation();

    context.isPreview = true;
  }

  handleElementsChanged(context) {
    // event.stopPropagation();

    context.isPreview = true;

    const {
      elements
    } = context;

    elements.forEach(element => {
      if (!this._elementsChanged.includes(element)) {
        this._elementsChanged.push(element);
      }
    });
  }

  handleRender(event, context) {
    context.attrs = {
      ...context.attrs,
      fill: 'white',
      stroke: '#0f62fe'
    };
  }

  getElementsChanged() {
    return this._elementsChanged;
  }
}

CommandStackPreview.$inject = [
  'commandStack',
  'eventBus',
  'graphicsFactory',
  'elementRegistry'
];

function isConnection(element) {
  return element.waypoints;
}