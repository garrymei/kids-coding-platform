export { registerKidsBlocks } from './registerBlocks.js';
export { BlocklyWorkspace } from './components/BlocklyWorkspace.js';
export type { BlocklyWorkspaceProps } from './components/BlocklyWorkspace.js';
export { createCodeGenerator } from './codegen.js';
export type { CodeGenerator, SupportedGenerator } from './codegen.js';
export {
  BLOCK_NAMESPACE,
  blockPalette,
  blockCategoryLabels,
  withNamespace,
} from './config/index.js';
export type { NamespacedBlockType } from './config/index.js';
