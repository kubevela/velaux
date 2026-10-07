import { Balloon } from '@alifd/next';
import * as monaco from 'monaco-editor';
import React from 'react';
import { AiFillCheckCircle, AiFillCloseCircle, AiFillWarning } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';

import { checkDraftExpression, checkExpression } from '../../api/application';
import type { ExpressionEnv } from './completion';
import { expressionSpans, hoverAt, suggest } from './completion';
import './index.less';

export type { ExpressionEnv, ExpressionVariable } from './completion';

const language = 'vela-cel';

// envs are the variables each open editor may read, by model URI, since a
// Monaco completion provider is registered once for every editor.
const envs = new Map<string, ExpressionEnv | undefined>();

let registered = false;

function register() {
  if (registered) {
    return;
  }
  registered = true;
  monaco.languages.register({ id: language });
  monaco.languages.setMonarchTokensProvider(language, {
    tokenizer: {
      root: [
        [/\$\(/, 'delimiter.bracket'],
        [/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/, 'string'],
        [/\d+(\.\d+)?/, 'number'],
        [/\b(true|false|null|in)\b/, 'keyword'],
        [/\b(context|source)\b/, 'type'],
      ],
    },
  });
  monaco.languages.registerHoverProvider(language, {
    provideHover: (model, position) => {
      const text = model.getLineContent(position.lineNumber);
      const hovered = hoverAt(text, position.column - 1, envs.get(model.uri.toString()));
      if (!hovered) {
        return undefined;
      }
      const { variable, path } = hovered;
      const contents = [{ value: `**${path.join('.')}**: \`${variable.type}\`` }];
      if (variable.description) {
        contents.push({ value: variable.description });
      }
      if (variable.schema && variable.schema !== variable.type) {
        contents.push({ value: '```cue\n' + variable.schema + '\n```' });
      }
      return {
        range: new monaco.Range(position.lineNumber, hovered.start + 1, position.lineNumber, hovered.end + 1),
        contents,
      };
    },
  });
  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '('],
    provideCompletionItems: (model, position) => {
      const before = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const { items, replace } = suggest(before, envs.get(model.uri.toString()));
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - replace,
        endColumn: position.column,
      };
      const kinds = {
        field: monaco.languages.CompletionItemKind.Field,
        function: monaco.languages.CompletionItemKind.Function,
        method: monaco.languages.CompletionItemKind.Method,
        snippet: monaco.languages.CompletionItemKind.Snippet,
      };
      return {
        suggestions: items.map((item, i) => ({
          label: item.label,
          kind: kinds[item.kind],
          detail: item.detail,
          documentation: item.documentation,
          insertText: item.insertText,
          insertTextRules: item.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          sortText: String(i).padStart(3, '0'),
          range,
        })),
      };
    },
  });
}

type Props = {
  id?: string;
  value?: any;
  onChange?: (value: string) => void;
  disabled?: boolean;
  appName: string;
  surface: string;
  // source names the source being edited, on the source surface.
  source?: string;
  // draft is an application being created, checked without it.
  draft?: boolean;
  // kind is the type the parameter expects: string, integer, number or boolean.
  kind?: string;
  env?: ExpressionEnv;
};

type State = {
  status?: { text: string; kind: 'ok' | 'error' | 'warning' };
};

// markWidth is the room at the right of the input kept for the status mark.
const markWidth = 30;

// ExpressionEditor edits a property value that may hold $( ) CEL expressions,
// suggesting what an expression can read and checking it as it is written.
class ExpressionEditor extends React.Component<Props, State> {
  container: React.RefObject<HTMLDivElement>;
  editor?: monaco.editor.IStandaloneCodeEditor;
  model?: monaco.editor.ITextModel;
  timer?: ReturnType<typeof setTimeout>;
  resize?: ResizeObserver;
  frames: string[] = [];
  checked = '';

  constructor(props: Props) {
    super(props);
    this.state = {};
    this.container = React.createRef();
  }

  componentDidMount() {
    register();
    if (!this.container.current) {
      return;
    }
    this.model = monaco.editor.createModel(
      this.text(this.props.value),
      language,
      monaco.Uri.parse(`inmemory://expression/${uuid()}`)
    );
    envs.set(this.model.uri.toString(), this.props.env);
    this.editor = monaco.editor.create(this.container.current, {
      model: this.model,
      readOnly: this.props.disabled,
      minimap: { enabled: false },
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 8,
      lineNumbersMinChars: 0,
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollBeyondLastLine: false,
      scrollbar: { vertical: 'hidden', horizontal: 'auto', horizontalScrollbarSize: 4 },
      wordWrap: 'off',
      fixedOverflowWidgets: true,
      fontSize: 13,
      lineHeight: 20,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      // These run in Monaco's editor worker, which VelaUX does not set up;
      // the suggestions here come from the variables alone.
      wordBasedSuggestions: false,
      occurrencesHighlight: false,
      selectionHighlight: false,
      links: false,
      codeLens: false,
    });
    // One line, laid out by hand: Monaco's automatic layout keeps its 400px
    // default when it measures the container before the form has laid out.
    const container = this.container.current;
    const layout = () => this.editor?.layout({ width: container.clientWidth - markWidth, height: 20 });
    layout();
    this.resize = new ResizeObserver(layout);
    this.resize.observe(container);
    // Enter accepts a suggestion and otherwise does nothing.
    this.editor.addCommand(monaco.KeyCode.Enter, () => undefined, '!suggestWidgetVisible');
    this.frame();
    this.model.onDidChangeContent(() => {
      this.frame();
      const text = (this.model?.getValue() || '').replace(/\n/g, ' ');
      if (this.props.onChange) {
        this.props.onChange(text);
      }
      this.scheduleCheck();
    });
    this.scheduleCheck();
  }

  componentDidUpdate(prev: Props) {
    if (this.model && prev.env !== this.props.env) {
      envs.set(this.model.uri.toString(), this.props.env);
    }
    if (this.editor && prev.disabled !== this.props.disabled) {
      this.editor.updateOptions({ readOnly: this.props.disabled });
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.model) {
      envs.delete(this.model.uri.toString());
    }
    this.resize?.disconnect();
    this.editor?.dispose();
    this.model?.dispose();
  }

  // frame shades each $( ) expression, so it stands apart from the literal
  // text around it.
  frame = () => {
    if (!this.editor || !this.model) {
      return;
    }
    const spans = expressionSpans(this.model.getValue());
    this.frames = this.editor.deltaDecorations(
      this.frames,
      spans.map(([start, end]) => ({
        range: new monaco.Range(1, start + 1, 1, end + 1),
        options: { className: 'vela-cel-frame' },
      }))
    );
  };

  text = (value: any) => (value === undefined || value === null ? '' : String(value));

  scheduleCheck = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this.check, 350);
  };

  check = async () => {
    const value = this.model?.getValue() || '';
    if (!this.model || value === this.checked) {
      return;
    }
    this.checked = value;
    const { appName, surface, source, kind, draft } = this.props;
    let res: any;
    try {
      res = draft
        ? await checkDraftExpression({ surface, value, kind })
        : await checkExpression(appName, { surface, value, kind, source });
    } catch (e) {
      return;
    }
    if (!this.model || this.model.getValue() !== value) {
      return;
    }
    const issues: Array<{ message: string; start: number; end: number; warning?: boolean }> = res?.issues || [];
    monaco.editor.setModelMarkers(
      this.model,
      language,
      issues.map((i) => ({
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: i.start + 1,
        endColumn: Math.max(i.end, i.start + 1) + 1,
        message: i.message,
        severity: i.warning ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
      }))
    );
    const first = issues.find((i) => !i.warning) || issues[0];
    if (first) {
      this.setState({ status: { text: first.message, kind: first.warning ? 'warning' : 'error' } });
    } else if (res?.type) {
      this.setState({ status: { text: `Evaluates to ${res.type}`, kind: 'ok' } });
    } else {
      this.setState({ status: undefined });
    }
  };

  render() {
    const { status } = this.state;
    const icons = { ok: <AiFillCheckCircle />, error: <AiFillCloseCircle />, warning: <AiFillWarning /> };
    return (
      <div className="expression-editor" id={this.props.id}>
        <div className={`expression-editor-input${this.props.disabled ? ' disabled' : ''}`} ref={this.container} />
        {status && (
          <Balloon.Tooltip
            trigger={<span className={`expression-editor-mark ${status.kind}`}>{icons[status.kind]}</span>}
            align="t"
          >
            {status.text}
          </Balloon.Tooltip>
        )}
      </div>
    );
  }
}

export default ExpressionEditor;
