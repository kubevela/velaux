import { Balloon, Button } from '@alifd/next';
import * as monaco from 'monaco-editor';
import React from 'react';
import { AiFillCheckCircle, AiFillCloseCircle, AiFillWarning } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';

import { checkDraftExpression, checkExpression } from '../../api/application';
import type { ExpressionEnv, ExpressionFix } from './completion';
import { blockingIssue } from './completion';
import { expressionSpans, fixesFor, hoverAt, suggest } from './completion';
import './index.less';

export type { ExpressionEnv, ExpressionVariable } from './completion';

const language = 'vela-cel';

// theme is the expression editor's light theme. Monaco keeps one theme for the
// whole page, and VelaUX's code editors set a dark one, so an expression editor
// claims its own whenever it mounts or takes focus.
const theme = 'vela-expression';

// envs are the variables each open editor may read, by model URI, since a
// Monaco completion provider is registered once for every editor.
const envs = new Map<string, ExpressionEnv | undefined>();

// fixes are the replacements the check last offered for each open editor, by
// model URI, for the one code action provider to find.
const fixes = new Map<string, ExpressionFix[]>();

// fixRange is where a fix applies in the editor's single line.
const fixRange = (fix: ExpressionFix) => new monaco.Range(1, fix.start + 1, 1, fix.end + 1);

let registered = false;

function register() {
  if (registered) {
    return;
  }
  registered = true;
  monaco.editor.defineTheme(theme, { base: 'vs', inherit: true, rules: [], colors: {} });
  monaco.languages.register({ id: language });
  monaco.languages.setMonarchTokensProvider(language, {
    tokenizer: {
      root: [
        [/\$\(/, 'delimiter.bracket'],
        [/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/, 'string'],
        [/\d+(\.\d+)?/, 'number'],
        [/\b(true|false|null|in)\b/, 'keyword'],
        [/\b(context|source|component)\b/, 'type'],
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
  monaco.languages.registerCodeActionProvider(language, {
    provideCodeActions: (model, _range, context) => ({
      actions: fixesFor(context.markers, fixes.get(model.uri.toString()) || []).map((fix) => ({
        title: `Write ${fix.text}`,
        kind: 'quickfix',
        isPreferred: true,
        diagnostics: context.markers.filter((m) => m.message === fix.message),
        edit: {
          edits: [
            {
              resource: model.uri,
              modelVersionId: model.getVersionId(),
              edit: { range: fixRange(fix), text: fix.text },
            },
          ],
        },
      })),
      dispose: () => undefined,
    }),
  });
  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '(', '$'],
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
          // An item that also replaces the dot before it is matched against
          // the dot as well, or Monaco would filter it out.
          filterText: item.replaceBefore ? `.${item.label}` : undefined,
          range: item.replaceBefore ? { ...range, startColumn: range.startColumn - item.replaceBefore } : range,
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
  // component names the component being edited, or the one a trait is on.
  component?: string;
  // draft is an application being created, checked without it.
  draft?: boolean;
  // kind is the type the parameter expects: string, integer, number or boolean.
  kind?: string;
  env?: ExpressionEnv;
  // reserve is room at the right of the input kept for the parent's own
  // control, such as the form's ƒx toggle; the status mark sits left of it.
  reserve?: number;
  // onStatus hears whether the value's last check found an error.
  onStatus?: (error: boolean) => void;
  // autoFocus focuses the editor when it mounts, its cursor at the end: a
  // field that becomes an expression as it is typed in keeps the keystrokes.
  autoFocus?: boolean;
};

type State = {
  status?: { text: string; kind: 'ok' | 'error' | 'warning'; fix?: ExpressionFix };
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
      theme,
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
    const layout = () =>
      this.editor?.layout({ width: container.clientWidth - markWidth - (this.props.reserve || 0), height: 20 });
    layout();
    this.resize = new ResizeObserver(layout);
    this.resize.observe(container);
    // Enter accepts a suggestion and otherwise does nothing.
    this.editor.addCommand(monaco.KeyCode.Enter, () => undefined, '!suggestWidgetVisible');
    monaco.editor.setTheme(theme);
    this.editor.onDidFocusEditorText(() => monaco.editor.setTheme(theme));
    if (this.props.autoFocus && this.model) {
      this.editor.focus();
      this.editor.setPosition({ lineNumber: 1, column: this.model.getLineMaxColumn(1) });
    }
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
      fixes.delete(this.model.uri.toString());
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
    const { appName, surface, source, component, kind, draft } = this.props;
    let res: any;
    try {
      res = draft
        ? await checkDraftExpression({ surface, value, kind })
        : await checkExpression(appName, { surface, value, kind, source, component });
    } catch (e) {
      return;
    }
    if (!this.model || this.model.getValue() !== value) {
      return;
    }
    const issues: Array<{ message: string; start: number; end: number; warning?: boolean; fix?: string }> =
      res?.issues || [];
    const offered: ExpressionFix[] = issues
      .filter((i) => i.fix)
      .map((i) => ({ start: i.start, end: i.end, text: i.fix as string, message: i.message }));
    fixes.set(this.model.uri.toString(), offered);
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
    this.props.onStatus?.(!!blockingIssue(issues));
    const first = issues.find((i) => !i.warning) || issues[0];
    if (first) {
      const fix = offered.find((f) => f.start === first.start && f.message === first.message);
      this.setState({ status: { text: first.message, kind: first.warning ? 'warning' : 'error', fix } });
    } else if (res?.type) {
      this.setState({ status: { text: `Evaluates to ${res.type}`, kind: 'ok' } });
    } else {
      this.setState({ status: undefined });
    }
  };

  // applyFix makes the replacement a check offered, as one undoable edit.
  applyFix = (fix: ExpressionFix) => {
    this.editor?.executeEdits('expression-fix', [{ range: fixRange(fix), text: fix.text }]);
    this.editor?.focus();
  };

  render() {
    const { status } = this.state;
    const icons = { ok: <AiFillCheckCircle />, error: <AiFillCloseCircle />, warning: <AiFillWarning /> };
    return (
      <div className="expression-editor" id={this.props.id}>
        <div className={`expression-editor-input${this.props.disabled ? ' disabled' : ''}`} ref={this.container} />
        {status && (
          <Balloon
            trigger={
              <span className={`expression-editor-mark ${status.kind}`} style={{ right: this.props.reserve || 0 }}>
                {icons[status.kind]}
              </span>
            }
            align="t"
            closable={false}
            triggerType="hover"
          >
            <div>{status.text}</div>
            {status.fix && (
              <Button
                className="expression-editor-fix"
                size="small"
                type="primary"
                text
                onClick={() => status.fix && this.applyFix(status.fix)}
              >
                {`Write ${status.fix.text}`}
              </Button>
            )}
          </Balloon>
        )}
      </div>
    );
  }
}

export default ExpressionEditor;
