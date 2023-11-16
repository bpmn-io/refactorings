import React, { useCallback } from 'react';

import { render } from 'react-dom';

import { Button } from '@carbon/react';

import {
  Checkmark,
  Close,
  MagicWand
} from '@carbon/icons-react';

import {
  attr as svgAttr,
  clear as svgClear,
  create as svgCreate
} from 'tiny-svg';

import { domify } from 'min-dom';

import { getBBox } from 'diagram-js/lib/util/Elements';

const ELEMENT_OVERLAY_TYPE = 'element-suggestions-overlays',
      GLOBAL_OVERLAY_TYPE = 'global-suggestions-overlays';

const RECT_PADDING = 12;

const SUGGESTIONS_OVERLAYS_ACTIVE_CLASS = 'suggestions-overlays-active';

const LAYER_NAME = 'suggestions-overlays';

export default class SuggestionsOverlays {
  constructor(eventBus, overlays, refactorings, injector, canvas) {
    this._overlays = overlays;
    this._refactorings = refactorings;
    this._injector = injector;
    this._canvas = canvas;

    eventBus.on([
      'shape.added',
      'element.changed'
    ], (event) => {
      const { element } = event;

      if (!isLabel(element)) {
        this.addElementOverlay(element);
      }
    });
  }

  async checkForSuggestions(element) {
    const suggestedRefactoring = await this._refactorings.getSuggestedRefactoring(element);

    if (suggestedRefactoring) {
      this.addElementOverlay(element, suggestedRefactoring);
    }
  }

  async addElementOverlay(element) {
    this._overlays.remove({ element, type: ELEMENT_OVERLAY_TYPE });

    const suggestedRefactoring = await this._refactorings.getSuggestedRefactoring(element);

    if (!suggestedRefactoring) {
      return;
    }

    const overlays = this._overlays;

    const html = domify('<div class="suggestions-overlay suggestions-overlay-element"></div>');

    const overlay = {
      position: {
        top: -24,
        left: -24
      },
      html,
      show: {
        minZoom: 0.5,
        maxZoom: 5.0
      },
      scale: true
    };

    overlays.add(element, ELEMENT_OVERLAY_TYPE, overlay);

    render(<ElementOverlay element={ element } injector={ this._injector } suggestedRefactoring={ suggestedRefactoring } />, html);
  }

  addGlobalOverlay(element, suggestedRefactoring, { cancel, ok, elements }) {
    this._canvas.getContainer().classList.add(SUGGESTIONS_OVERLAYS_ACTIVE_CLASS);

    const overlays = this._overlays;

    const html = domify('<div class="suggestions-overlay suggestions-overlay-global"></div>');

    const bounds = getBBox(elements);

    const overlay = {
      position: {
        top: bounds.y - 24,
        left: bounds.x - 24
      },
      html,
      show: {
        minZoom: 0.5,
        maxZoom: 5.0
      },
      scale: true
    };

    overlays.add(this._canvas.getRootElement(), GLOBAL_OVERLAY_TYPE, overlay);

    render(<GlobalOverlay element={ element } cancel={ cancel } ok={ ok } injector={ this._injector } suggestedRefactoring={ suggestedRefactoring } />, html);

    const rect = svgCreate('rect');

    rect.classList.add('suggestions-overlays-rect');

    svgAttr(rect, {
      x: bounds.x - RECT_PADDING,
      y: bounds.y - RECT_PADDING,
      width: bounds.width + RECT_PADDING * 2,
      height: bounds.height + RECT_PADDING * 2,
      rx: 4
    });

    this._canvas.getLayer(LAYER_NAME).appendChild(rect);
  }
}

function ElementOverlay({ element, injector, suggestedRefactoring }) {
  const overlays = injector.get('overlays'),
        refactorings = injector.get('refactorings'),
        suggestionsOverlays = injector.get('suggestionsOverlays');

  const suggestRefactoring = useCallback(async () => {
    const {
      cancel,
      ok,
      elements
    } = refactorings.preview(element, suggestedRefactoring);

    overlays.remove({ element, type: ELEMENT_OVERLAY_TYPE });

    suggestionsOverlays.addGlobalOverlay(element, suggestedRefactoring, {
      cancel,
      ok,
      elements
    });
  }, [ refactorings, suggestedRefactoring ]);

  return <Button className="suggest-refactoring" hasIconOnly onClick={ suggestRefactoring } label="Suggest refactoring">
    <MagicWand />
  </Button>;
}

function GlobalOverlay({ element, cancel, ok, injector, suggestedRefactoring }) {
  const canvas = injector.get('canvas'),
        overlays = injector.get('overlays');

  const onClick = useCallback(callback => {
    callback();

    canvas.getContainer().classList.remove(SUGGESTIONS_OVERLAYS_ACTIVE_CLASS);

    overlays.remove({ type: GLOBAL_OVERLAY_TYPE });

    svgClear(canvas.getLayer(LAYER_NAME));
  }, [ canvas, overlays ]);

  return <>
    <Button className="ok-refactoring" hasIconOnly onClick={ () => onClick(ok) } label="Apply refactoring">
      <Checkmark />
    </Button>
    <Button className="cancel-refactoring" kind="secondary" hasIconOnly onClick={ () => onClick(cancel) } label="Cancel refactoring">
      <Close />
    </Button>
  </>;
}

SuggestionsOverlays.$inject = [ 'eventBus', 'overlays', 'refactorings', 'injector', 'canvas' ];

function isLabel(element) {
  return element.labelTarget;
}