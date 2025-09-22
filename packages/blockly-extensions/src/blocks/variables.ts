import type * as BlocklyType from 'blockly';

export function registerVariableBlocks(Blockly: typeof BlocklyType) {
  if (Blockly.Blocks['kids_set_variable']) return;

  Blockly.Blocks['kids_set_variable'] = {
    init() {
      this.jsonInit({
        type: 'kids_set_variable',
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
        colour: 40,
        tooltip: 'Assign a value to a variable.',
      });
    },
  };

  Blockly.Blocks['kids_change_variable'] = {
    init() {
      this.jsonInit({
        type: 'kids_change_variable',
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
        colour: 40,
        tooltip: 'Increase or decrease a variable by a value.',
      });
    },
  };
}
