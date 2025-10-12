import { useEffect, useMemo, useRef } from 'react';
import Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/javascript';
import 'blockly/python';

type SupportedLanguage = 'python' | 'javascript';

export interface BlockEditorProps {
  language: SupportedLanguage;
  workspaceXml: string | null;
  onWorkspaceChange: (payload: { xml: string; code: string }) => void;
  readOnly?: boolean;
  height?: number | string;
}

const DEFAULT_TOOLBOX = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <category name="逻辑" colour="#5C81A6">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
  </category>
  <category name="循环" colour="#5CA65C">
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number">
          <field name="NUM">5</field>
        </shadow>
      </value>
    </block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for">
      <value name="FROM">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
      <value name="BY">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
  </category>
  <category name="数学" colour="#5CA65C">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <block type="math_single"></block>
    <block type="math_trig"></block>
  </category>
  <category name="文本" colour="#5CA68D">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_print"></block>
  </category>
  <category name="变量" custom="VARIABLE" colour="#A65C81"></category>
  <category name="函数" custom="PROCEDURE" colour="#995CA6"></category>
</xml>
`;

/**
 * Blockly editor wrapper that keeps XML in sync and produces code for the selected language.
 */
export function BlockEditor({
  language,
  workspaceXml,
  onWorkspaceChange,
  readOnly = false,
  height = 360,
}: BlockEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const lastXmlRef = useRef<string | null>(null);

  const toolboxXml = useMemo(() => DEFAULT_TOOLBOX, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) {
      return undefined;
    }

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: toolboxXml,
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
      },
      renderer: 'zelos',
      readOnly,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    workspaceRef.current = workspace;

    if (workspaceXml) {
      try {
        const dom = Blockly.Xml.textToDom(workspaceXml);
        Blockly.Xml.domToWorkspace(dom, workspace);
        lastXmlRef.current = workspaceXml;
      } catch {
        // ignore malformed XML
      }
    }

    const handleChange = () => {
      const currentWorkspace = workspaceRef.current;
      if (!currentWorkspace) return;

      const generator = language === 'python' ? Blockly.Python : Blockly.JavaScript;
      const xmlDom = Blockly.Xml.workspaceToDom(currentWorkspace);
      const xmlText = Blockly.Xml.domToText(xmlDom);

      if (xmlText === lastXmlRef.current) {
        return;
      }

      generator.init(currentWorkspace);
      let generated = '';
      try {
        generated = generator.workspaceToCode(currentWorkspace);
      } catch (error) {
        generated = '';
        console.error('Blockly code generation failed', error);
      }
      generator.finish?.(generated);

      lastXmlRef.current = xmlText;
      onWorkspaceChange({ xml: xmlText, code: generated });
    };

    workspace.addChangeListener(handleChange);

    const resizeObserver = new ResizeObserver(() => {
      workspace.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      workspace.removeChangeListener(handleChange);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [language, toolboxXml, onWorkspaceChange, readOnly, workspaceXml]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !workspaceXml) {
      return;
    }
    if (workspaceXml === lastXmlRef.current) {
      return;
    }

    try {
      workspace.clear();
      const dom = Blockly.Xml.textToDom(workspaceXml);
      Blockly.Xml.domToWorkspace(dom, workspace);
      lastXmlRef.current = workspaceXml;
    } catch {
      // Skip invalid XML
    }
  }, [workspaceXml]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      return;
    }
    workspace.setReadOnly(!!readOnly);
  }, [readOnly]);

  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.85)',
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    </div>
  );
}
