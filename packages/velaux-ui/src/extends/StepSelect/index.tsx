import { Select } from '@alifd/next';
import React, { useContext } from 'react';

import { WorkflowContext, WorkflowEditContext } from '../../context';
import i18n from '../../i18n';
import type { WorkflowStep, WorkflowStepBase } from '@velaux/data';
import { showAlias } from '../../utils/common';
import { locale } from '../../utils/locale';

type Props = {
  value?: string[];
  id: string;
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export const StepSelect = (props: Props) => {
  const { value, id, disabled } = props;
  const { stepName, steps } = useContext(WorkflowEditContext);
  const { workflow } = useContext(WorkflowContext);
  const stepOptions: Array<{ label: string; value: string }> = [];
  let inGroup = false;
  let groupStep: WorkflowStep | undefined;
  steps?.map((step) => {
    step.subSteps?.map((subStep) => {
      if (subStep.name === stepName) {
        inGroup = true;
        groupStep = step;
      }
    });
  });
  // A step in a group waits on the group's other steps; a top-level step on
  // the other top-level steps and, in DAG mode, the steps inside their groups.
  if (inGroup && groupStep) {
    groupStep.subSteps
      ?.filter((s) => s.name !== stepName)
      .map((step: WorkflowStepBase) => {
        stepOptions.push({ label: showAlias(step.name, step.alias), value: step.name });
      });
  } else {
    steps
      ?.filter((s) => s.name !== stepName)
      .map((step: WorkflowStep) => {
        stepOptions.push({ label: showAlias(step.name, step.alias), value: step.name });
        if (workflow?.mode === 'DAG') {
          step.subSteps?.map((b: WorkflowStepBase) => {
            stepOptions.push({
              label: `${showAlias(step.name, step.alias)}/${showAlias(b.name, b.alias)}`,
              value: b.name,
            });
          });
        }
      });
  }

  return (
    <Select
      placeholder={i18n.t('Please select the steps')}
      onChange={props.onChange}
      id={id}
      disabled={disabled}
      defaultValue={value || []}
      value={value || []}
      dataSource={stepOptions}
      mode="multiple"
      locale={locale().Select}
    />
  );
};
