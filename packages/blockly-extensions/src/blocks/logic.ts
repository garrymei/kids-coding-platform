import type * as BlocklyType from 'blockly';
import { blockPalette, withNamespace } from '../config/index.js';

export function registerLogicBlocks(Blockly: typeof BlocklyType) {
  const compareType = withNamespace('compare');
  if (Blockly.Blocks[compareType]) return;

  Blockly.Blocks[compareType] = {
    init() {
      this.jsonInit({
        type: compareType,
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
        colour: blockPalette.logic,
        tooltip: 'Compare two values and return a boolean result.',
      });
    },
  };

  const booleanType = withNamespace('boolean');
  Blockly.Blocks[booleanType] = {
    init() {
      this.jsonInit({
        type: booleanType,
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
        colour: blockPalette.logic,
        tooltip: 'Insert a true or false value.',
      });
    },
  };
}
