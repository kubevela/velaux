import { Button, Input, Message, Radio, Select } from '@alifd/next';
import yaml from 'js-yaml';
import React, { useContext, useState } from 'react';
import { BsXLg } from 'react-icons/bs';

import type { ForEach, WorkflowMode } from '@velaux/data';

import { WorkflowContext, WorkflowEditContext } from '../../context';
import ExpressionEditor from '../../extends/ExpressionEditor';
import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import { Translation } from '../Translation';
import { forEachProblem, forEachWarning, itemColumns } from './loop-edit';
import { declaredSteps } from './step-scope';

type Source = 'list' | 'from' | 'expression';

const sourceOf = (forEach: ForEach): Source => {
  if ('from' in forEach) {
    return 'from';
  }
  return forEach.items === undefined || Array.isArray(forEach.items) ? 'list' : 'expression';
};

// cell reads a typed-in value as YAML would, so 3 is a number and true a
// boolean, and anything else as the text itself.
const cell = (text: string): unknown => {
  try {
    const v = yaml.load(text);
    return v === null || typeof v === 'object' ? text : v;
  } catch {
    return text;
  }
};

const shown = (v: unknown) => (v === undefined || v === null ? '' : String(v));

// ItemsTable types a list in place: a row per item, a column per key, or a
// single column for a list of plain values.
const ItemsTable = (props: { items: unknown[]; onChange: (items: unknown[]) => void }) => {
  const { items, onChange } = props;
  const [newKey, setNewKey] = useState('');
  const columns = itemColumns(items);
  const plain = columns.length === 0;
  const setCell = (row: number, key: string | undefined, text: string) =>
    onChange(
      items.map((item, i) =>
        i !== row ? item : key ? { ...(item as Record<string, unknown>), [key]: cell(text) } : cell(text)
      )
    );
  const addKey = () => {
    const key = newKey.trim();
    if (!key || columns.includes(key)) {
      return;
    }
    // A list of plain values becomes objects, each value under the new key.
    onChange(
      items.length === 0
        ? [{ [key]: '' }]
        : items.map((item) =>
            item && typeof item === 'object' ? { ...(item as Record<string, unknown>), [key]: '' } : { [key]: item }
          )
    );
    setNewKey('');
  };
  return (
    <div className="loop-items-table">
      <div
        className="loop-items-row head"
        style={{ gridTemplateColumns: `32px repeat(${plain ? 1 : columns.length}, 1fr) 32px` }}
      >
        <span>#</span>
        {plain ? (
          <span>
            <Translation>value</Translation>
          </span>
        ) : (
          columns.map((c) => <span key={c}>{c}</span>)
        )}
        <span />
      </div>
      {items.map((item, row) => (
        <div
          key={row}
          className="loop-items-row"
          style={{ gridTemplateColumns: `32px repeat(${plain ? 1 : columns.length}, 1fr) 32px` }}
        >
          <span className="loop-items-index">{row}</span>
          {plain ? (
            <Input size="small" value={shown(item)} onChange={(v: string) => setCell(row, undefined, v)} />
          ) : (
            columns.map((c) => (
              <Input
                key={c}
                size="small"
                value={shown((item as Record<string, unknown>)?.[c])}
                onChange={(v: string) => setCell(row, c, v)}
              />
            ))
          )}
          <button
            type="button"
            className="loop-items-remove"
            aria-label={i18n.t('Remove item').toString()}
            onClick={() => onChange(items.filter((_, i) => i !== row))}
          >
            <BsXLg />
          </button>
        </div>
      ))}
      <div className="loop-items-actions">
        <Button
          size="small"
          text
          type="primary"
          onClick={() =>
            onChange([...items, plain && items.length > 0 ? '' : Object.fromEntries(columns.map((c) => [c, '']))])
          }
        >
          {'+\u00a0'}
          <Translation>Add item</Translation>
        </Button>
        <span className="loop-items-key">
          <Input
            size="small"
            placeholder={i18n.t('New key').toString()}
            value={newKey}
            onChange={setNewKey}
            onPressEnter={addKey}
          />
          <Button size="small" text type="primary" onClick={addKey} disabled={!newKey.trim()}>
            {'+\u00a0'}
            <Translation>Add key</Translation>
          </Button>
        </span>
      </div>
    </div>
  );
};

// ItemsYaml types the whole list as YAML; it takes effect once it parses to a
// list.
const ItemsYaml = (props: { items: unknown[]; onChange: (items: unknown[]) => void }) => {
  const [text, setText] = useState(() => yaml.dump(props.items));
  const [error, setError] = useState('');
  return (
    <div>
      <Input.TextArea
        className="loop-items-yaml"
        rows={8}
        value={text}
        onChange={(v: string) => {
          setText(v);
          try {
            const parsed = yaml.load(v);
            if (!Array.isArray(parsed)) {
              setError(i18n.t('The items must be a list').toString());
              return;
            }
            setError('');
            props.onChange(parsed);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      {error && <div className="loop-items-error">{error}</div>}
    </div>
  );
};

type Props = {
  value: ForEach;
  onChange: (forEach: ForEach) => void;
};

// LoopItems edits what a loop repeats over and how: a list typed in, an
// earlier step's output, or (in an application) a $( ) expression, and whether
// the items run one at a time or all at once.
export const LoopItems = (props: Props) => {
  const { value, onChange } = props;
  const { appName } = useContext(WorkflowContext);
  const { steps, stepName } = useContext(WorkflowEditContext);
  const [asYaml, setAsYaml] = useState(false);
  // kept holds what each source had, so switching back and forth loses nothing.
  const [kept, setKept] = useState<Partial<Record<Source, ForEach>>>({});
  const source = sourceOf(value);
  const mode = value.mode;
  // withSettings keeps the loop's mode and key as its items change.
  const withSettings = (f: ForEach): ForEach => ({
    ...f,
    ...(mode ? { mode } : {}),
    ...(value.key ? { key: value.key } : {}),
  });

  const switchTo = (next: Source) => {
    if (next === source) {
      return;
    }
    setKept({ ...kept, [source]: value });
    const fresh: Record<Source, ForEach> = { list: { items: [] }, from: { from: '' }, expression: { items: '' } };
    onChange(withSettings(kept[next] || fresh[next]));
  };

  const outputs: Array<{ value: string; label: string }> = [];
  (steps || []).forEach((s) => {
    const add = (owner: { name: string; alias?: string; outputs?: Array<{ name: string }> }) =>
      owner.name !== stepName &&
      (owner.outputs || []).forEach((o) =>
        outputs.push({ value: o.name, label: `${owner.alias || owner.name} › ${o.name}` })
      );
    add(s);
    (s.subSteps || []).forEach(add);
  });

  const problem = forEachProblem(value);
  const warning = forEachWarning(value);
  const items = Array.isArray(value.items) ? value.items : [];

  return (
    <div className="loop-items">
      <div className="loop-items-label">
        <Translation>What to repeat over</Translation>
      </div>
      <div className="loop-items-help">
        <Translation>The loop runs its steps once for each item in this list.</Translation>
      </div>
      <Radio.Group shape="button" value={source} onChange={(v) => switchTo(v as Source)}>
        <Radio value="list">{i18n.t('List').toString()}</Radio>
        <Radio value="from">{i18n.t('From a step').toString()}</Radio>
        {appName && <Radio value="expression">{i18n.t('Expression').toString()}</Radio>}
      </Radio.Group>

      <div className="loop-items-body">
        {source === 'list' && (
          <>
            {asYaml ? (
              <ItemsYaml items={items} onChange={(next) => onChange(withSettings({ items: next }))} />
            ) : (
              <ItemsTable items={items} onChange={(next) => onChange(withSettings({ items: next }))} />
            )}
            <Button size="small" text type="primary" onClick={() => setAsYaml(!asYaml)}>
              <Translation>{asYaml ? 'Edit as a table' : 'Edit as YAML'}</Translation>
            </Button>
          </>
        )}
        {source === 'from' && (
          <>
            <Select
              className="loop-items-from"
              locale={locale().Select}
              placeholder={i18n.t('Output of an earlier step').toString()}
              dataSource={outputs}
              value={value.from || undefined}
              onChange={(v: string) => onChange(withSettings({ from: v }))}
            />
            <div className="loop-items-help">
              <Translation>
                Read when the loop starts, then kept for the rest of the run. The loop waits for that step.
              </Translation>
            </div>
          </>
        )}
        {source === 'expression' && appName && (
          <>
            <ExpressionEditor
              appName={appName}
              surface="workflowstep"
              step={{ steps: declaredSteps(steps || []) }}
              value={typeof value.items === 'string' ? value.items : ''}
              onChange={(v: string) => onChange(withSettings({ items: v }))}
            />
            <div className="loop-items-help">
              <Translation>The whole value is one $( ) expression that gives a list.</Translation>
            </div>
          </>
        )}
      </div>

      <div className="loop-items-label">
        <Translation>Name each item by</Translation>
      </div>
      <Select
        className="loop-items-key-select"
        mode="tag"
        locale={locale().Select}
        placeholder={i18n.t('Its place in the list').toString()}
        dataSource={itemColumns(items)}
        value={value.key || []}
        onChange={(key: string[]) => {
          const { key: _, ...rest } = value;
          onChange(key && key.length ? { ...rest, key } : rest);
        }}
      />
      <div className="loop-items-help">
        <Translation>
          The steps run for an item are named after these values, joined with -, and read them as each.key. Leave it
          empty to number them.
        </Translation>
      </div>

      {problem && <div className="loop-items-error">{i18n.t(problem).toString()}</div>}
      {warning && (
        <Message type="warning" size="medium">
          {i18n.t(warning).toString()}
        </Message>
      )}

      <div className="loop-items-label">
        <Translation>Run items</Translation>
      </div>
      <Radio.Group
        value={mode || 'StepByStep'}
        onChange={(v) => onChange({ ...value, mode: v as WorkflowMode })}
        dataSource={[
          {
            value: 'StepByStep',
            label: `${i18n.t('One at a time').toString()}, ${i18n
              .t('the next item starts once this one succeeds')
              .toString()}`,
          },
          {
            value: 'DAG',
            label: `${i18n.t('All at once').toString()}, ${i18n.t('every item starts together').toString()}`,
          },
        ]}
        itemDirection="ver"
      />
    </div>
  );
};

export const loopModeLabel = (mode?: string) => (mode === 'DAG' ? 'All at once' : 'One at a time');
