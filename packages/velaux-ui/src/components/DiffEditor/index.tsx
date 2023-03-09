import * as monaco from 'monaco-editor';
import React, { useEffect } from 'react';

import defineTheme from '../DefinitionCode/theme';
export const DiffEditor = (props: {
  id: string;
  base: string;
  target: string;
  language?: string;
}) => {
  const { language = 'yaml', base, target, id } = props;
  useEffect(() => {
    const container: any = document.getElementById(id);
    if (container) {
      container.innerHTML = '';
    }
    if (defineTheme) {
      monaco.editor.defineTheme('default', defineTheme as any);
      monaco.editor.setTheme('default');
    }
    const diffEditor = monaco.editor.createDiffEditor(container);

    diffEditor.setModel({
      original: monaco.editor.createModel(base, language),
      modified: monaco.editor.createModel(target, language),
    });
  }, [id, language, base, target]);
  return <></>;
};
