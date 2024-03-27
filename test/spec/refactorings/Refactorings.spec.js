import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import RefactoringsModule from '../../../lib/refactorings';
import Refactorings from '../../../lib/refactorings/Refactorings';

import OpenAIElementTemplatesProvider from '../../../lib/refactorings/providers/open-ai-element-emplates/OpenAIElementTemplatesProvider';

import FoobarProvider from './FoobarProvider';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';

describe('Refactorings', function() {

  describe('providers', function() {

    beforeEach(bootstrapModeler(diagramXML, {
      additionalModules: [
        CloudElementTemplatesCoreModule,
        RefactoringsModule
      ],
      refactorings: {
        openai: {
          createChatCompletion: () => {}
        }
      }
    }));


    it('should have default providers', inject(function(refactorings) {

      // given
      // when
      // then
      expect(refactorings.getProviders()).to.have.length(1);
      expect(refactorings.getProviders()[0]).to.be.instanceOf(OpenAIElementTemplatesProvider);
    }));


    it('should register provider', inject(function(injector, refactorings) {

      // given
      // when
      injector.instantiate(FoobarProvider);

      // then
      expect(refactorings.getProviders()).to.have.length(2);
      expect(refactorings.getProviders()[0]).to.be.instanceOf(OpenAIElementTemplatesProvider);
      expect(refactorings.getProviders()[1]).to.be.instanceOf(FoobarProvider);
    }));

  });


  describe('refactorings', function() {

    beforeEach(bootstrapModeler(diagramXML, {
      additionalModules: [
        {
          __init__: [
            'refactorings',
            'foobarProvider'
          ],
          refactorings: [ 'type', Refactorings ],
          foobarProvider: [ 'type', FoobarProvider ]
        }
      ]
    }));


    it('should get refactorings', inject(async function(elementRegistry, refactorings) {

      // given
      const element = elementRegistry.get('StartEvent_1');

      // when
      const _refactorings = await refactorings.getRefactorings([ element ]);

      // then
      expect(_refactorings).to.have.length(3);
      expect(_refactorings[0].id).to.equal('foo');
      expect(_refactorings[0].label).to.equal('Foo');
      expect(_refactorings[0].execute).to.exist;

      expect(_refactorings[1].id).to.equal('bar');
      expect(_refactorings[1].label).to.equal('Bar');
      expect(_refactorings[1].execute).to.exist;

      expect(_refactorings[2].id).to.equal('baz');
      expect(_refactorings[2].label).to.equal('Baz');
      expect(_refactorings[2].execute).to.exist;
    }));

  });

});