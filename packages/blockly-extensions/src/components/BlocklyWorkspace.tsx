import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/javascript';
import 'blockly/python';
import { registerKidsBlocks } from '../registerBlocks.js';

export interface BlocklyWorkspaceProps {
  /** Initial workspace XML to load when the component mounts. */
  initialXml?: string;
  /** Notified when the workspace mutates (block changes, moves, etc.). */
  onWorkspaceChange?: (_workspace: Blockly.WorkspaceSvg) => void;
  /** Workspace height. */
  height?: string | number;
  /** Workspace width. */
  width?: string | number;
}

const defaultXml = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="kids_set_variable" x="30" y="20">
    <value name="VALUE">
      <shadow type="math_number">
        <field name="NUM">5</field>
      </shadow>
    </value>
  </block>
</xml>`;

/**
 * React wrapper around a Blockly workspace that registers Kids Coding blocks.
 */
export function BlocklyWorkspace({
  initialXml = defaultXml,
  onWorkspaceChange,
  height = 480,
  width = '100%',
}: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (!workspaceRef.current) {
      registerKidsBlocks(Blockly);
      workspaceRef.current = Blockly.inject(container, {
        toolbox: defaultToolbox,
        renderer: 'thrasos',
        collapse: false,
        trashcan: true,
        scrollbars: true,
      });

      const xml = Blockly.utils.xml.textToDom(initialXml);
      Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
    }

    const workspace = workspaceRef.current;

    const listener = () => {
      if (workspace && onWorkspaceChange) {
        onWorkspaceChange(workspace);
      }
    };

    workspace?.addChangeListener(listener);
    return () => {
      workspace?.removeChangeListener(listener);
    };
  }, [initialXml, onWorkspaceChange]);

  useEffect(() => () => {
    workspaceRef.current?.dispose();
    workspaceRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="kids-blockly-workspace"
    />
  );
}

const defaultToolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '控制',
      colour: '#6C63FF',
      contents: [
        { kind: 'block', type: 'kids_repeat_times' },
        { kind: 'block', type: 'kids_wait_seconds' },
      ],
    },
    {
      kind: 'category',
      name: '变量',
      colour: '#2D9CDB',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: '运算',
      colour: '#F2C94C',
      contents: [
        { kind: 'block', type: 'kids_compare' },
        { kind: 'block', type: 'kids_boolean' },
        { kind: 'block', type: 'math_number' },
      ],
    },
  ],
};
