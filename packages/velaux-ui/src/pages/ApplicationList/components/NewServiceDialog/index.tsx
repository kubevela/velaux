import { Button, Dialog, Field, Form, Input, Message, Radio, Select, Switch } from '@alifd/next';
import React, { useEffect, useState } from 'react';

import type { Env, UserProject } from '@velaux/data';
import { createApplication } from '../../../../api/application';
import { getEnvs } from '../../../../api/env';
import { Translation } from '../../../../components/Translation';
import KV from '../../../../extends/KV';
import i18n from '../../../../i18n';
import { checkName } from '../../../../utils/common';
import type { NewServiceValues } from './request';
import { defaultEnvs, newServiceRequest } from './request';
import './index.less';

type Props = {
  projects?: UserProject[];
  // project fixes the tenant, as on a tenant's own page.
  project?: string;
  onClose: () => void;
  onCreated: (name: string) => void;
};

// NewServiceDialog creates an application with no component: who and where it
// is, and how it is kept. Its components, sources and policies are added on its
// own page, which opens once it is created.
export const NewServiceDialog = (props: Props) => {
  const field = Field.useField({
    values: {
      project: props.project || props.projects?.[0]?.name,
      envs: [],
      expressions: false,
      labels: {},
      annotations: {},
      paused: false,
      resyncInterval: '',
      workflowMode: 'StepByStep',
    },
  });
  const [envs, setEnvs] = useState<Env[]>([]);
  const [saving, setSaving] = useState(false);
  const project = field.getValue('project') as string;
  useEffect(() => {
    if (!project) {
      setEnvs([]);
      return;
    }
    getEnvs({ project }).then((res: any) => {
      const loaded: Env[] = res?.envs || [];
      setEnvs(loaded);
      field.setValue(
        'envs',
        defaultEnvs(
          loaded.map((e) => e.name),
          (field.getValue('envs') as string[]) || []
        )
      );
    });
  }, [project, field]);
  const submit = () => {
    field.validate((errors: any, values: any) => {
      if (errors) {
        return;
      }
      setSaving(true);
      createApplication(newServiceRequest(values as NewServiceValues))
        .then((res: any) => {
          if (res) {
            Message.success(i18n.t('Application created').toString());
            props.onCreated(values.name);
          }
        })
        .finally(() => setSaving(false));
    });
  };
  const { init } = field;
  return (
    <Dialog
      v2
      visible
      width={760}
      title={<Translation>New Application</Translation>}
      onClose={props.onClose}
      footer={
        <div className="new-service-footer">
          <Button onClick={props.onClose}>
            <Translation>Cancel</Translation>
          </Button>
          <Button type="primary" loading={saving} onClick={submit}>
            <Translation>Create</Translation>
          </Button>
        </div>
      }
    >
      <Form field={field} labelAlign="top" fullWidth className="new-service">
        <div className="new-service-grid">
          <Form.Item label={<Translation>Name</Translation>} required>
            <Input
              {...init('name', {
                rules: [
                  { required: true, message: i18n.t('Give the application a name').toString() },
                  { pattern: checkName, message: i18n.t('Lower case letters, digits and hyphens').toString() },
                ],
              })}
              maxLength={32}
            />
          </Form.Item>
          <Form.Item label={<Translation>Alias</Translation>}>
            <Input {...init('alias')} maxLength={64} />
          </Form.Item>
        </div>
        <Form.Item label={<Translation>Description</Translation>}>
          <Input.TextArea {...init('description')} maxLength={256} rows={2} />
        </Form.Item>
        <div className="new-service-grid">
          <Form.Item label={<Translation>Project</Translation>} required>
            <Select
              {...init('project', { rules: [{ required: true, message: i18n.t('Choose a project').toString() }] })}
              disabled={!!props.project}
              dataSource={(props.projects || []).map((p) => ({ value: p.name, label: p.alias || p.name }))}
              onChange={(v: string) => {
                field.setValue('project', v);
                field.setValue('envs', []);
              }}
            />
          </Form.Item>
          <Form.Item
            label={<Translation>Environment</Translation>}
            help={<Translation>Where it deploys; more can be added later</Translation>}
          >
            <Select
              {...init('envs')}
              mode="multiple"
              dataSource={envs.map((e) => ({ value: e.name, label: e.alias || e.name }))}
              placeholder={i18n.t('Choose').toString()}
            />
          </Form.Item>
        </div>

        <div className="new-service-section">
          <Translation>Settings</Translation>
        </div>
        <div className="new-service-grid">
          <Form.Item
            label={<Translation>Expressions</Translation>}
            help={<Translation>Let properties read sources, context and other components with $( )</Translation>}
          >
            <Switch {...init('expressions', { valueName: 'checked' })} />
          </Form.Item>
          <Form.Item label={<Translation>Workflow mode</Translation>}>
            <Radio.Group
              {...init('workflowMode')}
              dataSource={[
                { value: 'StepByStep', label: i18n.t('Step by step').toString() },
                { value: 'DAG', label: 'DAG' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={<Translation>Start paused</Translation>}
            help={<Translation>Deploy it, but leave the controller from reconciling it until resumed</Translation>}
          >
            <Switch {...init('paused', { valueName: 'checked' })} />
          </Form.Item>
          <Form.Item
            label={<Translation>Resync interval</Translation>}
            help={<Translation>How often the controller reconciles it, such as 5m; the default when empty</Translation>}
          >
            <Input
              {...init('resyncInterval', {
                rules: [
                  {
                    pattern: /^\s*(([0-9]+(\.[0-9]+)?(h|m|s))+)?\s*$/,
                    message: i18n.t('A duration such as 10m or 1h').toString(),
                  },
                ],
              })}
              placeholder="5m"
            />
          </Form.Item>
        </div>
        <Form.Item label={<Translation>Labels</Translation>}>
          <KV {...init('labels')} id="new-service-labels" disabled={false} />
        </Form.Item>
        <Form.Item label={<Translation>Annotations</Translation>}>
          <KV {...init('annotations')} id="new-service-annotations" disabled={false} />
        </Form.Item>
      </Form>
    </Dialog>
  );
};
