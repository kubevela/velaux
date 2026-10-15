import { Input, Radio } from '@alifd/next';
import React, { useState } from 'react';

import type { ExpressionStep } from '@velaux/data';

import ExpressionEditor from '../../extends/ExpressionEditor';
import type { ExpressionEnv } from '../../extends/ExpressionEditor';
import i18n from '../../i18n';
import type { ConditionMode } from './condition';
import { conditionMode, switchCondition } from './condition';

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  // appName is the application whose workflow this is; without one, as in a
  // pipeline, an if is CUE only.
  appName?: string;
  scope?: ExpressionStep;
  env?: ExpressionEnv;
};

// ConditionInput edits a step's if: as CUE, as it always was, or as one $( )
// expression that must give a bool, checked as it is written. It opens in the
// mode its value is in, and an if is saved exactly as written in either.
export const ConditionInput = (props: Props) => {
  const { value, onChange, appName, scope, env } = props;
  const [mode, setMode] = useState<ConditionMode>(conditionMode(value));
  // An expression is on offer where the application reads them, and kept
  // wherever an if already is one.
  const offered = !!appName && ((!!env?.enabled && !!env?.optedIn) || mode === 'expression');
  const change = (v: string) => onChange && onChange(v);
  const switchTo = (to: ConditionMode) => {
    if (to !== mode) {
      setMode(to);
      change(switchCondition(value, to));
    }
  };
  return (
    <div className="condition-input">
      {offered && (
        <Radio.Group
          shape="button"
          size="small"
          value={mode}
          onChange={(v) => switchTo(v as ConditionMode)}
          dataSource={[
            { value: 'cue', label: i18n.t('CUE').toString() },
            { value: 'expression', label: i18n.t('$( ) expression').toString() },
          ]}
        />
      )}
      {offered && mode === 'expression' ? (
        <ExpressionEditor
          appName={appName || ''}
          surface="workflowstep"
          kind="boolean"
          step={scope}
          env={env}
          value={value}
          onChange={change}
        />
      ) : (
        <Input name="if" value={value} onChange={(v: string) => change(v)} />
      )}
      {offered && (
        <div className="condition-input-help">
          {mode === 'expression'
            ? i18n.t('A whole $( ) expression is a CEL condition and must give a bool').toString()
            : i18n.t('CUE, such as status.<step>.succeeded; a whole $( ) expression makes it CEL').toString()}
        </div>
      )}
    </div>
  );
};
