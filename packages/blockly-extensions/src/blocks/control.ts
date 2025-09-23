import type * as BlocklyType from 'blockly';
import { blockPalette, withNamespace } from '../config/index.js';

/**
 * Registers control-related custom blocks.
 */
export function registerControlBlocks(Blockly: typeof BlocklyType) {
  const repeatTimesType = withNamespace('repeat_times');
  if (Blockly.Blocks[repeatTimesType]) return;

  Blockly.Blocks[repeatTimesType] = {
    init() {
      this.jsonInit({
        type: repeatTimesType,
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
        colour: blockPalette.control,
        tooltip: 'Repeat enclosed blocks a specified number of times.',
      });
    },
  };

  const waitSecondsType = withNamespace('wait_seconds');
  Blockly.Blocks[waitSecondsType] = {
    init() {
      this.jsonInit({
        type: waitSecondsType,
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
        colour: blockPalette.control,
        tooltip: 'Pause execution for a number of seconds.',
      });
    },
  };
}
