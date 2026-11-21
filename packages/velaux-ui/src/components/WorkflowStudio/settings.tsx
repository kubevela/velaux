import { Button, Checkbox, Field, Form, Input, Radio, Select } from '@alifd/next';
import React from 'react';

import type { ListSharedWorkflowsResponse, SharedWorkflow, SharedWorkflowScope, WorkflowMode } from '@velaux/data';

import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import { usableShared } from '../../utils/sharedWorkflows';
import DrawerWithFooter from '../Drawer';
import { Translation } from '../Translation';

// WorkflowSettings are a workflow's own fields, apart from its steps. With a
// ref, its steps come from that shared Workflow, and an empty mode follows the
// shared one's.
export type WorkflowSettings = {
  name: string;
  alias?: string;
  description?: string;
  mode: WorkflowMode | '';
  subMode: WorkflowMode | '';
  default?: boolean;
  ref?: string;
};

const modeLabel = (mode?: WorkflowMode | '') => (mode === 'DAG' ? 'In parallel' : 'In order');

// scopeLabel names where a shared workflow is.
export const scopeLabel = (scope?: SharedWorkflowScope) =>
  scope === 'global' ? 'Global' : scope === 'project' ? 'Project' : 'This environment';

// sharedOptions groups shared workflows as the picker shows them: the
// project's, then global ones. One that cannot be used is offered but
// disabled, saying why.
const sharedOptions = (shared: SharedWorkflow[], projectUnavailable?: boolean) =>
  (['project', 'global'] as SharedWorkflowScope[])
    .map((scope) => ({
      label: i18n.t(scopeLabel(scope)).toString(),
      children: shared
        .filter((s) => s.scope === scope)
        .map((s) => {
          const why = s.hidden
            ? i18n.t("hidden by the project's").toString()
            : !usableShared(s, projectUnavailable)
            ? i18n.t('not reachable from this environment').toString()
            : '';
          return {
            value: usableShared(s, projectUnavailable) ? s.name : `unusable:${s.scope}:${s.name}`,
            label: `${s.alias || s.name}${why ? ` (${why})` : ''}`,
            disabled: !usableShared(s, projectUnavailable),
          };
        }),
    }))
    .filter((group) => group.children.length > 0);

// SettingsSummary is the toolbar's one-line account of how a workflow runs,
// naming the shared workflow it uses, if any.
export const SettingsSummary = (props: {
  mode: WorkflowMode;
  subMode: WorkflowMode;
  shared?: string;
  scope?: SharedWorkflowScope;
}) => (
  <span className="studio-settings-summary">
    {props.shared && (
      <>
        <Translation>{props.scope === 'environment' ? 'Shared' : scopeLabel(props.scope)}</Translation>{' '}
        <code>{props.shared}</code>
        <span className="studio-settings-sep">·</span>
      </>
    )}
    <Translation>{modeLabel(props.mode)}</Translation>
    <span className="studio-settings-sep">·</span>
    <Translation>groups</Translation> <Translation>{modeLabel(props.subMode).toLowerCase()}</Translation>
  </span>
);

type Props = {
  settings: WorkflowSettings;
  // withDefault offers whether the workflow is its environment's default; a
  // pipeline has none.
  withDefault?: boolean;
  // loadShared, where given, offers running a shared Workflow's steps.
  loadShared?: () => Promise<ListSharedWorkflowsResponse>;
  // onApply hands back the settings and, with a ref, the shared Workflow.
  onApply: (settings: WorkflowSettings, shared?: SharedWorkflow) => void;
  onClose: () => void;
};

type State = {
  stepsFrom: 'own' | 'shared';
  shared?: SharedWorkflow[];
  globalUnavailable?: boolean;
  projectUnavailable?: boolean;
};

// WorkflowSettingsPanel edits a workflow's own fields. Apply hands them back to
// the studio as unsaved changes; the studio's Save stores them with the steps.
export class WorkflowSettingsPanel extends React.Component<Props, State> {
  field = new Field(this);

  constructor(props: Props) {
    super(props);
    this.state = { stepsFrom: props.settings.ref ? 'shared' : 'own' };
  }

  componentDidMount() {
    this.field.setValues(this.props.settings);
    if (this.props.loadShared) {
      this.props.loadShared().then((res) =>
        this.setState({
          shared: res.workflows,
          globalUnavailable: res.globalUnavailable,
          projectUnavailable: res.projectUnavailable,
        })
      );
    }
  }

  // chosen is the shared workflow the ref runs: the project's wins over a
  // global one of its name, as in KubeVela.
  chosen = () =>
    this.state.shared?.find(
      (s) => s.name === this.field.getValue('ref') && usableShared(s, this.state.projectUnavailable)
    );

  apply = () => {
    this.field.validate((error, values: any) => {
      if (error) {
        return;
      }
      if (this.state.stepsFrom === 'own') {
        // Running its own steps, the workflow follows no shared modes.
        const { mode, subMode } = values;
        this.props.onApply({
          ...this.props.settings,
          ...values,
          ref: undefined,
          mode: mode || 'StepByStep',
          subMode: subMode || 'DAG',
        });
        return;
      }
      this.props.onApply({ ...this.props.settings, ...values }, this.chosen());
    });
  };

  modeOptions = (shared?: WorkflowMode) => [
    ...(this.state.stepsFrom === 'shared'
      ? [
          {
            value: '',
            label: `${i18n.t("Use the shared workflow's").toString()} (${i18n.t(modeLabel(shared)).toString()})`,
          },
        ]
      : []),
    { value: 'StepByStep', label: i18n.t('In order').toString(), title: 'StepByStep' },
    { value: 'DAG', label: i18n.t('In parallel').toString(), title: 'DAG' },
  ];

  render() {
    const { init } = this.field;
    const { settings, withDefault, loadShared, onClose } = this.props;
    const { stepsFrom, shared, globalUnavailable, projectUnavailable } = this.state;
    const chosen = this.chosen();
    return (
      <DrawerWithFooter
        title={<Translation>Workflow settings</Translation>}
        placement="right"
        width={560}
        onClose={onClose}
        onOk={this.apply}
        onOkButtonText="Apply"
        extButtons={[
          <Button key="cancel" style={{ marginRight: '16px' }} onClick={onClose}>
            <Translation>Cancel</Translation>
          </Button>,
        ]}
      >
        <Form field={this.field} labelAlign="top" className="studio-settings">
          <Form.Item label={<Translation>Name</Translation>}>
            <Input value={settings.name} disabled />
          </Form.Item>
          <Form.Item label={<Translation>Alias</Translation>}>
            <Input
              name="alias"
              {...init('alias', {
                rules: [{ minLength: 2, maxLength: 64, message: 'Enter a string of 2 to 64 characters.' }],
              })}
            />
          </Form.Item>
          <Form.Item label={<Translation>Description</Translation>}>
            <Input.TextArea
              name="description"
              rows={3}
              {...init('description', {
                rules: [{ maxLength: 256, message: 'Enter a description that contains less than 256 characters.' }],
              })}
            />
          </Form.Item>
          {loadShared && (
            <Form.Item label={<Translation>Steps from</Translation>}>
              <Radio.Group
                value={stepsFrom}
                onChange={(value) => {
                  const from = value as State['stepsFrom'];
                  this.setState({ stepsFrom: from });
                  // A shared workflow starts by following its modes.
                  if (from === 'shared' && !settings.ref) {
                    this.field.setValues({ mode: '', subMode: '' });
                  }
                }}
              >
                <Radio value="own">
                  <Translation>This workflow</Translation>
                </Radio>
                <Radio value="shared">
                  <Translation>A shared workflow</Translation>
                </Radio>
              </Radio.Group>
            </Form.Item>
          )}
          {stepsFrom === 'shared' && (
            <Form.Item
              label={<Translation>Shared workflow</Translation>}
              required
              help={
                globalUnavailable && !chosen
                  ? i18n.t('Global shared workflows could not be loaded.').toString()
                  : shared && shared.length === 0
                  ? i18n.t('There are no shared workflows for this project, nor global ones.').toString()
                  : chosen
                  ? `${i18n.t(scopeLabel(chosen.scope)).toString()} · ${chosen.steps.length} ${i18n
                      .t(chosen.steps.length === 1 ? 'step' : 'steps')
                      .toString()}`
                  : projectUnavailable
                  ? i18n
                      .t(
                        "This environment's applications run outside the project's namespace, so they can use global shared workflows only."
                      )
                      .toString()
                  : undefined
              }
            >
              <Select
                locale={locale().Select}
                state={!shared ? 'loading' : undefined}
                dataSource={sharedOptions(shared || [], projectUnavailable)}
                {...init('ref', {
                  rules: [{ required: true, message: i18n.t('Choose a shared workflow').toString() }],
                })}
              />
            </Form.Item>
          )}
          <Form.Item
            label={<Translation>Steps run</Translation>}
            help={i18n
              .t(
                'In order, each step waits for the one before it; in parallel, each starts once what it depends on is done.'
              )
              .toString()}
          >
            <Select locale={locale().Select} dataSource={this.modeOptions(chosen?.mode)} {...init('mode')} />
          </Form.Item>
          <Form.Item
            label={<Translation>Steps in groups run</Translation>}
            help={i18n.t('For a group that does not choose its own.').toString()}
          >
            <Select
              locale={locale().Select}
              dataSource={this.modeOptions(chosen?.subMode || 'DAG')}
              {...init('subMode')}
            />
          </Form.Item>
          {withDefault && (
            <Form.Item>
              <Checkbox
                checked={!!this.field.getValue('default')}
                onChange={(checked: boolean) => this.field.setValue('default', checked)}
              >
                <Translation>Default workflow for this environment</Translation>
              </Checkbox>
            </Form.Item>
          )}
        </Form>
      </DrawerWithFooter>
    );
  }
}
