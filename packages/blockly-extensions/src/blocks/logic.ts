import type * as BlocklyType from 'blockly';

export function registerLogicBlocks(Blockly: typeof BlocklyType) {
  if (Blockly.Blocks['kids_compare']) return;

  Blockly.Blocks['kids_compare'] = {
    init() {
      this.jsonInit({
        type: 'kids_compare',
        message0: '%1 %2 %3',
        args0: [
          {
            type: 'input_value',
            name: 'LEFT',
          },
          {
            type: 'field_dropdown',
            name: 'OP',
            options: [
              ['=', 'EQ'],
              ['≠', 'NE'],
              ['>', 'GT'],
              ['≥', 'GTE'],
              ['<', 'LT'],
              ['≤', 'LTE'],
            ],
          },
          {
            type: 'input_value',
            name: 'RIGHT',
          },
        ],
        inputsInline: true,
        output: 'Boolean',
        colour: 200,
        tooltip: 'Compare two values and return a boolean result.',
      });
    },
  };

  Blockly.Blocks['kids_boolean'] = {
    init() {
      this.jsonInit({
        type: 'kids_boolean',
        message0: '%1',
        args0: [
          {
            type: 'field_dropdown',
            name: 'BOOL',
            options: [
              ['true', 'TRUE'],
              ['false', 'FALSE'],
            ],
          },
        ],
        output: 'Boolean',
        colour: 200,
        tooltip: 'Insert a true or false value.',
      });
    },
  };
}
