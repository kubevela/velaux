import { Button, Dialog, Input, Message, Radio } from '@alifd/next';
import React, { useState } from 'react';
import { AiOutlineEdit, AiOutlineReload, AiOutlineStop } from 'react-icons/ai';

import { cancelWorkflowRestart, restartApplicationWorkflow, setReconcileInterval } from '../../../../api/application';
import Permission from '../../../../components/Permission';
import { RowAction } from '../../../../components/RowAction';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { ApplicationStatus } from '@velaux/data';
import { momentDate } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { restartPlan } from '../../../../utils/reconciliation';
import { timeLeft } from '../../../../utils/sourceStatus';
import './index.less';

type Props = {
  appName: string;
  envName: string;
  projectName?: string;
  status: ApplicationStatus;
  onChanged: () => void;
  // readOnly is an application its addon manages: its settings are shown, not changed.
  readOnly?: boolean;
};

// IntervalDialog sets the Application's resync period, or clears it back to the
// controller's default.
const IntervalDialog = (props: { current?: string; onSave: (interval: string) => void; onClose: () => void }) => {
  const [value, setValue] = useState(props.current || '');
  return (
    <Dialog
      visible
      v2
      title={i18n.t('Resync interval').toString()}
      onClose={props.onClose}
      footer={
        <div className="reconciliation-dialog-footer">
          <Button onClick={() => props.onSave('')}>
            <Translation>Use the default</Translation>
          </Button>
          <Button type="primary" onClick={() => props.onSave(value.trim())}>
            <Translation>Save</Translation>
          </Button>
        </div>
      }
      locale={locale().Dialog}
    >
      <p className="reconciliation-dialog-hint">
        <Translation>How often the controller re-checks this environment, as a duration of at least 10s.</Translation>
      </p>
      <Input value={value} onChange={(v) => setValue(v)} placeholder="5m" />
    </Dialog>
  );
};

// RestartDialog restarts the workflow now, once at a time, or after every completion.
const RestartDialog = (props: { onRestart: (schedule: string) => void; onClose: () => void }) => {
  const [mode, setMode] = useState<'now' | 'once' | 'every'>('now');
  const [at, setAt] = useState('');
  const [every, setEvery] = useState('');
  const schedule = () => {
    if (mode === 'once') {
      return at ? new Date(at).toISOString().replace(/\.\d{3}Z$/, 'Z') : '';
    }
    return mode === 'every' ? every.trim() : '';
  };
  const ready = mode === 'now' || (mode === 'once' && at !== '') || (mode === 'every' && every.trim() !== '');
  return (
    <Dialog
      visible
      v2
      title={i18n.t('Restart workflow').toString()}
      onClose={props.onClose}
      footer={
        <div className="reconciliation-dialog-footer">
          <Button onClick={props.onClose}>
            <Translation>Cancel</Translation>
          </Button>
          <Button type="primary" disabled={!ready} onClick={() => props.onRestart(schedule())}>
            <Translation>Restart</Translation>
          </Button>
        </div>
      }
      locale={locale().Dialog}
    >
      <Radio.Group
        className="reconciliation-restart-modes"
        value={mode}
        onChange={(v) => setMode(v as 'now' | 'once' | 'every')}
      >
        <Radio value="now">
          <Translation>Now</Translation>
        </Radio>
        <Radio value="once">
          <Translation>Once, at a time</Translation>
        </Radio>
        <Radio value="every">
          <Translation>After every completion</Translation>
        </Radio>
      </Radio.Group>
      {mode === 'once' && (
        <input
          className="reconciliation-datetime"
          type="datetime-local"
          value={at}
          onChange={(e) => setAt(e.target.value)}
        />
      )}
      {mode === 'every' && <Input value={every} onChange={(v) => setEvery(v)} placeholder="1h" />}
    </Dialog>
  );
};

// Reconciliation is how the controller treats this environment's Application:
// whether it is paused, how often it resyncs, any workflow restart pending or
// recurring, and whether it follows definition changes.
const Reconciliation = (props: Props) => {
  const { appName, envName, projectName, status, onChanged } = props;
  const [dialog, setDialog] = useState<'interval' | 'restart' | undefined>();
  const plan = restartPlan(status.restartWorkflow, status.workflowRestartScheduledAt);
  const resource = `project:${projectName}/application:${appName}/envBinding:${envName}`;
  const done = (message: string) => (re: unknown) => {
    if (re) {
      Message.success(i18n.t(message));
      setDialog(undefined);
      onChanged();
    }
  };
  const next = plan.next ? timeLeft(plan.next) : undefined;
  return (
    <div className="reconciliation">
      <dl className="reconciliation-grid">
        <dt>
          <Translation>State</Translation>
        </dt>
        <dd>
          {status.paused ? (
            <StatusBadge tone="suspended" label="Paused" title={i18n.t('Reconciliation paused').toString()} />
          ) : (
            <StatusBadge tone="healthy" label="Active" />
          )}
        </dd>
        <dd />

        <dt>
          <Translation>Resync interval</Translation>
        </dt>
        <dd>
          {status.reconcileInterval ? (
            <span>
              <Translation>Every</Translation> {status.reconcileInterval}
            </span>
          ) : (
            <span className="row-list-muted">
              <Translation>Controller default</Translation>
            </span>
          )}
        </dd>
        <dd className="reconciliation-actions">
          {!props.readOnly && (
            <Permission request={{ resource, action: 'update' }} project={projectName}>
              <RowAction icon={<AiOutlineEdit />} label="Edit" onClick={() => setDialog('interval')} />
            </Permission>
          )}
        </dd>

        <dt>
          <Translation>Workflow restart</Translation>
        </dt>
        <dd>
          {plan.mode === 'none' && (
            <span className="row-list-muted">
              <Translation>None scheduled</Translation>
            </span>
          )}
          {plan.mode === 'now' && <Translation>Restarting</Translation>}
          {plan.mode !== 'none' && plan.mode !== 'now' && (
            <span>
              {plan.mode === 'every' && (
                <span>
                  <Translation>Every</Translation> {plan.every}
                  {plan.next && ', '}
                </span>
              )}
              {plan.next && (
                <span title={momentDate(plan.next.toISOString())}>
                  {next ? (
                    <span>
                      <Translation>next in</Translation> {next}
                    </span>
                  ) : (
                    <Translation>due now</Translation>
                  )}
                </span>
              )}
            </span>
          )}
        </dd>
        <dd className="reconciliation-actions">
          {!props.readOnly && (
            <Permission request={{ resource, action: 'restart' }} project={projectName}>
              <RowAction icon={<AiOutlineReload />} label="Restart workflow" onClick={() => setDialog('restart')} />
              {(plan.mode === 'once' || plan.mode === 'every') && (
                <RowAction
                  icon={<AiOutlineStop />}
                  label="Cancel the restart"
                  danger
                  onClick={() => cancelWorkflowRestart({ appName, envName }).then(done('Workflow restart cancelled'))}
                />
              )}
            </Permission>
          )}
        </dd>

        {status.autoUpdate && (
          <React.Fragment>
            <dt>
              <Translation>Definition auto-update</Translation>
            </dt>
            <dd className="reconciliation-warning">
              <Translation>On: VelaUX deploys are refused while it is on</Translation>
            </dd>
            <dd />
          </React.Fragment>
        )}
      </dl>
      {dialog === 'interval' && (
        <IntervalDialog
          current={status.reconcileInterval}
          onClose={() => setDialog(undefined)}
          onSave={(interval) =>
            setReconcileInterval({ appName, envName, interval }).then(done('Resync interval saved'))
          }
        />
      )}
      {dialog === 'restart' && (
        <RestartDialog
          onClose={() => setDialog(undefined)}
          onRestart={(schedule) =>
            restartApplicationWorkflow({ appName, envName, schedule }).then(done('Workflow restart requested'))
          }
        />
      )}
    </div>
  );
};

export default Reconciliation;
