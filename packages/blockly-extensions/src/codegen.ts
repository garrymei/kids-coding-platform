import type * as BlocklyType from 'blockly';

export type SupportedGenerator = 'python' | 'javascript';

export interface CodeGenerator {
  toPython(workspace: BlocklyType.Workspace): string;
  toJavaScript(workspace: BlocklyType.Workspace): string;
}

function resolveGenerator<T extends SupportedGenerator>(
  Blockly: typeof BlocklyType,
  language: T,
) {
  const key = language === 'python' ? 'Python' : 'JavaScript';
  const generator = (Blockly as typeof BlocklyType & Record<string, BlocklyType.Generator | undefined>)[key];
  if (!generator) {
    throw new Error(
      `Blockly ${key} generator is not registered. Make sure to import 'blockly/${language}' before generating code.`,
    );
  }
  return generator;
}

export function createCodeGenerator(Blockly: typeof BlocklyType): CodeGenerator {
  return {
    toPython(workspace) {
      return resolveGenerator(Blockly, 'python').workspaceToCode(workspace);
    },
    toJavaScript(workspace) {
      return resolveGenerator(Blockly, 'javascript').workspaceToCode(workspace);
    },
  };
}
