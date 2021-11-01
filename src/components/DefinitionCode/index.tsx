import React from 'react';
import * as monaco from 'monaco-editor';

type Props = {
  containerId: string;
  value?: string;
  readOnly?: boolean;
  language: string;
  fileUrl?: string;
  defineTheme: any;
  runtime?: any;
  'data-meta'?: string;
  id?: string;
  onChange?: (params: any) => void;
};

type State = {
  textModel: any;
};

class DefinitionCode extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      textModel: {},
    };
  }

  componentDidMount() {
    const {
      containerId,
      value = '',
      language,
      readOnly,
      onChange,
      fileUrl = `//b.txt`,
      defineTheme,
    } = this.props;
    const container: any = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
    if (defineTheme) {
      monaco.editor.defineTheme(containerId, defineTheme);
      monaco.editor.setTheme(containerId);
    }
    const modelUri = monaco.Uri.parse(`${containerId}:${fileUrl}`);
    let model = monaco.editor.getModel(modelUri);
    if (!model) {
      model = monaco.editor.createModel(value, language, modelUri);
    }
    model.setValue(value);
    const editor = monaco.editor.create(container, {
      value,
      language,
      readOnly,
      minimap: { enabled: false },
      automaticLayout: true,
      model,
      theme: containerId,
    });
    const textModel: any = editor.getModel();
    if (onChange) {
      editor.onDidChangeModelContent(() => onChange(textModel.getValue()));
    }
    monaco.editor.setModelLanguage(textModel, language);
    this.setState({ textModel });
  }

  componentWillReceiveProps(nextProps: Props) {
    const { language, value, runtime } = nextProps;
    if (
      language !== this.props.language ||
      runtime !== this.props.runtime ||
      value !== this.props.value
    ) {
      this.state.textModel.setValue(value);
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <div></div>;
  }
}

export default DefinitionCode;
