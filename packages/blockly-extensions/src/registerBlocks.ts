import type * as BlocklyType from 'blockly';
import { registerControlBlocks } from './blocks/control.js';
import { registerVariableBlocks } from './blocks/variables.js';
import { registerLogicBlocks } from './blocks/logic.js';

/**
 * Register all Kids Coding custom blocks with a Blockly instance.
 */
export function registerKidsBlocks(Blockly: typeof BlocklyType) {
  registerControlBlocks(Blockly);
  registerVariableBlocks(Blockly);
  registerLogicBlocks(Blockly);
}
