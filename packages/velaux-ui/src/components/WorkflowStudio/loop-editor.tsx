import { Button, Dialog } from '@alifd/next';
import React, { useState } from 'react';

import type { ForEach, WorkflowStep } from '@velaux/data';

import { WorkflowEditContext } from '../../context';
import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import { Translation } from '../Translation';
import { forEachProblem } from './loop-edit';
import { LoopItems } from './loop-items';

type Props = {
  step: WorkflowStep;
  steps: WorkflowStep[];
  onSave: (forEach: ForEach | undefined) => void;
  onClose: () => void;
};

// LoopEditor makes a step or group repeat once per item, changes what an
// existing loop repeats over, or stops it repeating.
export const LoopEditor = (props: Props) => {
  const { step, steps, onSave, onClose } = props;
  const [forEach, setForEach] = useState<ForEach>(step.forEach || { items: [] });
  const looped = !!step.forEach;
  const problem = forEachProblem(forEach);
  return (
    <Dialog
      v2
      visible
      width={760}
      locale={locale().Dialog}
      title={`${i18n.t(looped ? 'Loop' : 'Repeat').toString()}: ${step.alias || step.name}`}
      onClose={onClose}
      footer={
        <div className="add-step-footer">
          {looped && (
            <Button warning onClick={() => onSave(undefined)} style={{ marginRight: 'auto' }}>
              <Translation>Stop repeating</Translation>
            </Button>
          )}
          <Button onClick={onClose}>
            <Translation>Cancel</Translation>
          </Button>
          <Button type="primary" disabled={!!problem} onClick={() => onSave(forEach)}>
            <Translation>{looped ? 'Save' : 'Repeat'}</Translation>
          </Button>
        </div>
      }
    >
      <WorkflowEditContext.Provider value={{ steps, stepName: step.name }}>
        <LoopItems value={forEach} onChange={setForEach} />
      </WorkflowEditContext.Provider>
    </Dialog>
  );
};
