import type * as BlocklyType from 'blockly';
import { blockPalette, withNamespace } from '../config/index.js';

export function registerVariableBlocks(Blockly: typeof BlocklyType) {
  const setVariableType = withNamespace('set_variable');
  if (Blockly.Blocks[setVariableType]) return;

  Blockly.Blocks[setVariableType] = {
    init() {
      this.jsonInit({
        type: setVariableType,
        message0: 'set %1 to %2',
        args0: [
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'item',
          },
          {
            type: 'input_value',
            name: 'VALUE',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: blockPalette.variables,
        tooltip: 'Assign a value to a variable.',
      });
    },
  };

  const changeVariableType = withNamespace('change_variable');
  Blockly.Blocks[changeVariableType] = {
    init() {
      this.jsonInit({
        type: changeVariableType,
        message0: 'change %1 by %2',
        args0: [
          {
            type: 'field_variable',
            name: 'VAR',
            variable: 'item',
          },
          {
            type: 'input_value',
            name: 'DELTA',
            check: 'Number',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: blockPalette.variables,
        tooltip: 'Increase or decrease a variable by a value.',
      });
    },
  };
}
