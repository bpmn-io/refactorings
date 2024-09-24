# Changelog

All notable changes to [@bpmn-io/refactorings](https://github.com/bpmn-io/refactorings) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 1.0.0

* `DEPS`: cleanup dependencies

## 0.3.0

* `FEAT`: suggest templates available at runtime ([#27](https://github.com/bpmn-io/refactorings/pull/27))

## 0.2.2

* `CHORE`: move context pad entry ([#26](https://github.com/bpmn-io/refactorings/pull/26))

## 0.2.1

* `FIX`: remove unused `@bpmn-io/properties-panel` peer dependency ([#25](https://github.com/bpmn-io/refactorings/pull/25))

## 0.2.0

* `FEAT`: refactor OpenAI provider ([#22](https://github.com/bpmn-io/refactorings/pull/22))
* `FEAT`: fire event when executing refactoring ([#22](https://github.com/bpmn-io/refactorings/pull/22))
* `FIX`: fix popup menu position ([#21](https://github.com/bpmn-io/refactorings/pull/21))
* `FIX`: set context pad entry to active when opening popup menu ([#21](https://github.com/bpmn-io/refactorings/pull/21))

### Notable Changes

* one-to-one mapping between tool and element template dropped in favor of one-to-many mapping allowing us to combine multiple element templates into single tool (e.g. element templates with start event and message start event variations are now combined into a single tool)
* better handling of cases where no tool is available (e.g. "Update Facebook status")

## 0.1.0

Initial release