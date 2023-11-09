import {
  forEach
} from 'min-dash';

export default class MultiCommandHandler {
  constructor(commandStack) {
    this._commandStack = commandStack;
  }

  preExecute(context) {
    const commandStack = this._commandStack;

    forEach(context, function(command) {
      commandStack.execute(command.command, command.context);
    });
  }
}

MultiCommandHandler.$inject = [ 'commandStack' ];