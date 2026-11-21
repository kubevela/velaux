import { Dialog } from '@alifd/next';
import React from 'react';

import type { WorkflowMode, WorkflowStep } from '@velaux/data';

import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import { forwardWaitsIn } from '../PipelineGraph/dependencies';

// confirmOrderedSave saves, after asking first when a step that runs in order
// waits on one that runs after it: KubeVela would leave that run pending for
// ever.
export function confirmOrderedSave(steps: WorkflowStep[], mode: WorkflowMode, subMode: WorkflowMode, save: () => void) {
  const forward = forwardWaitsIn(steps, mode, subMode);
  if (forward.length === 0) {
    save();
    return;
  }
  Dialog.confirm({
    type: 'confirm',
    title: i18n.t('This run would never finish').toString(),
    content: (
      <div>
        <p>{i18n.t('These steps run in order but wait on a step that runs after them').toString()}</p>
        <ul>
          {forward.map((f) => (
            <li key={`${f.step}-${f.waitsOn}`}>
              <code>{f.step}</code> {i18n.t('waits on').toString()} <code>{f.waitsOn}</code>
            </li>
          ))}
        </ul>
        <p>{i18n.t('Save anyway?').toString()}</p>
      </div>
    ),
    onOk: save,
    locale: locale().Dialog,
  });
}
