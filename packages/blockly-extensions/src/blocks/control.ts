import type * as BlocklyType from 'blockly';

/**
 * Registers control-related custom blocks.
 */
export function registerControlBlocks(Blockly: typeof BlocklyType) {
  if (Blockly.Blocks['kids_repeat_times']) return;

  Blockly.Blocks['kids_repeat_times'] = {
    init() {
      this.jsonInit({
        type: 'kids_repeat_times',
        message0: 'repeat %1 times %2 do %3',
        args0: [
          {
            type: 'input_value',
            name: 'TIMES',
            check: 'Number',
          },
          {
            type: 'input_dummy',
          },
          {
            type: 'input_statement',
            name: 'DO',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 260,
        tooltip: 'Repeat enclosed blocks a specified number of times.',
      });
    },
  };

  Blockly.Blocks['kids_wait_seconds'] = {
    init() {
      this.jsonInit({
        type: 'kids_wait_seconds',
        message0: 'wait %1 seconds',
        args0: [
          {
            type: 'input_value',
            name: 'SECONDS',
            check: 'Number',
          },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 260,
        tooltip: 'Pause execution for a number of seconds.',
      });
    },
  };
}
