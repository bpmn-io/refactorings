import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { render } from 'react-dom';

import { Button, ButtonSet, Loading, InlineLoading } from '@carbon/react';

import { Checkmark, Close, MagicWand } from '@carbon/icons-react';

import { domify } from 'min-dom';

export default class SuggestionsOverlays {
  constructor(eventBus, overlays, refactorings) {
    this._overlays = overlays;
    this._refactorings = refactorings;

    eventBus.on([
      'shape.added',
      'element.changed'
    ], (event) => {
      const { element } = event;

      if (!isLabel(element)) {
        this.addSuggestionsOverlays(element);
      }
    });
  }

  async checkForSuggestions(element) {
    const suggestedRefactoring = await this._refactorings.getSuggestedRefactoring(element);

    if (suggestedRefactoring) {
      this.addSuggestionsOverlays(element, suggestedRefactoring);
    }
  }

  async addSuggestionsOverlays(element) {
    this._overlays.remove({ element });

    const suggestedRefactoring = await this._refactorings.getSuggestedRefactoring(element);

    if (!suggestedRefactoring) {
      return;
    }

    const overlays = this._overlays;

    const html = domify('<div class="suggestions-overlay"></div>');

    this._render(html, element, suggestedRefactoring);

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

    overlays.add(element, 'suggestions', overlay);
  }

  _render(container, element, suggestedRefactoring) {
    render(<App element={ element } refactorings={ this._refactorings } suggestedRefactoring={ suggestedRefactoring } />, container);
  }
}

function App({ element, refactorings, suggestedRefactoring }) {
  const [ previewing, setPreviewing ] = useState(false);
  const cleanUp = useRef();

  const suggestRefactoring = useCallback(async () => {
    setPreviewing(true);

    cleanUp.current = refactorings.preview(element, suggestedRefactoring);
  }, [ refactorings, suggestedRefactoring ]);

  const applyRefactoring = useCallback(() => {
    cleanUp.current();

    setPreviewing(false);

    refactorings.refactor(element, suggestedRefactoring);
  }, [ cleanUp, refactorings, suggestedRefactoring ]);

  const cancelRefactoring = useCallback(() => {
    cleanUp.current();

    setPreviewing(false);
  }, [ cleanUp ]);

  if (previewing) {
    return <>
      <Button className="apply-refactoring" hasIconOnly onClick={ applyRefactoring } label="Apply refactoring">
        <Checkmark />
      </Button>
      <Button className="apply-refactoring" kind="secondary" hasIconOnly onClick={ cancelRefactoring } label="Apply refactoring">
        <Close />
      </Button>
    </>;
  }

  return <Button className="suggest-refactoring" hasIconOnly onClick={ suggestRefactoring } label="Suggest refactoring">
    <MagicWand />
  </Button>;
}

SuggestionsOverlays.$inject = [ 'eventBus', 'overlays', 'refactorings' ];

function isLabel(element) {
  return element.labelTarget;
}