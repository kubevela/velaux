import { Button, Checkbox, Dialog, Loading } from '@alifd/next';
import type { ApplicationPolicyBase } from '@velaux/data';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';

import { getPolicyList } from '../../api/application';
import { detailWorkflow } from '../../api/workflows';
import { locale } from '../../utils/locale';
import './index.less';

type Props = {
  appName: string;
  envName: string;
  workflowName?: string;
  onRemove: (keepWorkflow: boolean) => void;
  onClose: () => void;
};

type Item = { name: string; type: string };

// RemoveEnvDialog confirms removing an app from an env, listing the env's workflow steps and policies, which are kept
// for when the env is added back unless the user unticks the option.
export const RemoveEnvDialog = (props: Props) => {
  const { appName, envName, workflowName, onRemove, onClose } = props;
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<Item[]>([]);
  const [policies, setPolicies] = useState<Item[]>([]);

  useEffect(() => {
    const workflow = workflowName
      ? detailWorkflow({ appName, name: workflowName }).then((res: { steps?: Item[] }) =>
          setSteps((res?.steps || []).map(({ name, type }) => ({ name, type })))
        )
      : Promise.resolve();
    const policy = getPolicyList({ appName }).then((res: { policies?: ApplicationPolicyBase[] }) =>
      setPolicies((res?.policies || []).filter((p) => p.envName === envName).map(({ name, type }) => ({ name, type })))
    );
    Promise.allSettled([workflow, policy]).finally(() => setLoading(false));
  }, [appName, envName, workflowName]);

  const group = (label: string, items: Item[]) =>
    items.length > 0 && (
      <div className="remove-env-group">
        <div className="remove-env-label">{label}</div>
        {items.map((item) => (
          <div className="remove-env-item" key={item.name}>
            <span className="remove-env-name">{item.name}</span>
            <span className="remove-env-type">{item.type}</span>
          </div>
        ))}
      </div>
    );
  const hasConfig = steps.length > 0 || policies.length > 0;

  return (
    <Dialog
      visible
      v2
      width={520}
      className="remove-env-dialog"
      title={i18n.t('Remove the environment').toString()}
      onClose={onClose}
      locale={locale().Dialog}
      footer={
        <div className="remove-env-footer">
          <Button onClick={onClose}>{i18n.t('Cancel').toString()}</Button>
          <Button type="primary" warning disabled={loading} onClick={() => onRemove(keep)}>
            {i18n.t('Remove').toString()}
          </Button>
        </div>
      }
    >
      <Loading visible={loading} style={{ width: '100%' }}>
        <p className="remove-env-question">
          {i18n.t('Remove this application from the environment').toString()} <strong>{envName}</strong>?
        </p>
        {hasConfig && (
          <div className="remove-env-panel">
            {group(i18n.t('Workflow steps').toString(), steps)}
            {group(i18n.t('Policies').toString(), policies)}
          </div>
        )}
        {hasConfig && (
          <Checkbox className="remove-env-keep" checked={keep} onChange={(checked: boolean) => setKeep(checked)}>
            {i18n.t('Keep them for when the environment is added back').toString()}
          </Checkbox>
        )}
      </Loading>
    </Dialog>
  );
};
