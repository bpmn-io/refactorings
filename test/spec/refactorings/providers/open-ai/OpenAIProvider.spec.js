import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import OpenAIFoobarProvider from './OpenAIFoobarProvider';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

describe('OpenAIProvider', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      {
        __init__: [
          'refactorings',
          'openAIFoobarProvider',
        ],
        refactorings: [ 'type', Refactorings ],
        openAIFoobarProvider: [ 'type', OpenAIFoobarProvider ]
      }
    ],
    refactorings: {
      openai: {
        createChatCompletion: () => {}
      }
    }
  }));


  it('should get refactorings', inject(async function(elementRegistry, openAIFoobarProvider, refactorings) {

    // given
    const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
      return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
    });

    const elements = [
      elementRegistry.get('Task_1')
    ];

    // when
    const _refactorings = await refactorings.getRefactorings(elements);

    // then
    expect(_refactorings).to.have.length(1);
    expect(_refactorings[0].id).to.equal('foobar');
    expect(_refactorings[0].label).to.equal('Foobar');
    expect(spy).to.have.been.called;
  }));


  it('should not get refactoring (more than one element)', inject(async function(elementRegistry, openAIFoobarProvider, refactorings) {

    // given
    const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
      return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
    });

    const elements = [
      elementRegistry.get('StartEvent_1'),
      elementRegistry.get('Task_1')
    ];

    // when
    const _refactorings = await refactorings.getRefactorings(elements);

    // then
    expect(_refactorings).to.have.length(0);
    expect(spy).to.not.have.been.called;
  }));


  describe('caching', function() {

    it('should return cached', inject(async function(elementRegistry, openAIFoobarProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('foobar');
      expect(spy).not.to.have.been.called;
    }));


    it('should update ID of cached on element ID change', inject(async function(elementRegistry, modeling, openAIFoobarProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.updateProperties(elements[0], { id: 'Task_2' });

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('foobar');
      expect(spy).not.to.have.been.called;
    }));


    it('shoud delete cached on element name change', inject(async function(elementRegistry, modeling, openAIFoobarProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.updateProperties(elements[0], { name: 'Send Slack notification to John' });

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;
    }));


    it('should delete cached on element removed', inject(async function(
        bpmnFactory, canvas, elementRegistry, modeling, openAIFoobarProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIFoobarProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'foobar', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.removeShape(elements[0]);

      modeling.createShape({
        type: 'bpmn:Task',
        businessObject: bpmnFactory.create('bpmn:Task', {
          id: 'Task_1',
          name: 'Send Slack notification to John'
        })
      }, { x: 100, y: 100 }, canvas.getRootElement());

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('foobar');
      expect(spy).to.have.been.called;
    }));

  });

});