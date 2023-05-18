import * as React from 'react';
import { Dialog, Form, Grid, Message, NumberPicker } from '@alifd/next';
import { DeployModes , Workflow , WorkflowStep , DefinitionBase } from '@velaux/data';
import _ from 'lodash';
import i18n from '../../../../i18n';
import { locale } from '../../../../utils/locale';
import './index.less';
import Item from '../../../../components/Item';
import { If } from '../../../../components/If';
import { locationService } from '../../../../services/LocationService';

const { Row, Col } = Grid;

interface Props {
  workflow?: Workflow;
  definitions?: DefinitionBase[];
  onChange(steps: WorkflowStep[]): void;
  onCancel(): void;
}

const generateCanaryDeployGroup = (step: WorkflowStep, batch: number): WorkflowStep => {
  const interval = Math.round(100 / batch);
  const policies: string[] | null = step.properties ? step.properties['policies'] : null;
  const steps: WorkflowStep[] = [
    {
      name: 'prepare-canary',
      alias: 'Prepare Canary',
      type: DeployModes.CanaryDeploy,
      properties: {
        weight: 0,
        policies: _.cloneDeep(policies),
      },
    },
  ];
  for (let i = 1; i <= batch; i++) {
    const batchStep: WorkflowStep = {
      name: step.name + '-batch-' + i,
      alias: 'Batch ' + i,
      type: DeployModes.CanaryDeploy,
      properties: {
        weight: i == batch ? 100 : interval * i,
        policies: [],
      },
    };
    if (policies && batchStep.properties) {
      batchStep.properties['policies'] = _.cloneDeep(policies);
    }
    const approveStep: WorkflowStep = { name: step.name + '-approve-' + i, alias: 'Approve ' + i, type: 'suspend' };
    if (i > 0) {
      steps.push(approveStep);
    }
    steps.push(batchStep);
  }
  return {
    type: 'step-group',
    name: step.name + '-canary',
    mode: 'StepByStep',
    subSteps: steps,
  };
};

export const CanarySetting: React.FunctionComponent<Props> = (props: Props) => {
  const [deployBatchConfig, setDeployBatchConfig] = React.useState<Record<string, number>>({});
  const initBatch = 2;
  const getStepBatch = (stepName: string): number => {
    if (deployBatchConfig[stepName]) {
      return deployBatchConfig[stepName];
    }
    return initBatch;
  };

  const canaryDeployDefinition = props.definitions?.find((d) => d.name === DeployModes.CanaryDeploy);
  const onSubmit = () => {
    if (!canaryDeployDefinition) {
      locationService.push('/addons/kruise-rollout');
      return;
    }
    const newSteps = props.workflow?.steps?.map((step) => {
      if (step.type === DeployModes.Deploy) {
        const batch = getStepBatch(step.name);
        return generateCanaryDeployGroup(step, batch);
      }
      return step;
    });
    if (newSteps) {
      props.onChange(newSteps);
    }
    props.onCancel();
  };
  const deploySteps = props.workflow?.steps?.filter((step) => step.type === DeployModes.Deploy);
  const canSetting = deploySteps && deploySteps.length > 0;
  return (
    <Dialog
      v2
      locale={locale().Dialog}
      onCancel={props.onCancel}
      onClose={props.onCancel}
      onOk={onSubmit}
      footerActions={canSetting ? ['ok', 'cancel'] : ['cancel']}
      title={i18n.t('Canary Rollout Setting').toString()}
      visible
      width="600px"
    >
      <If condition={!canaryDeployDefinition}>
        <Message type="warning">
          {i18n.t("The default canary rollout is powered by kruise-rollout addon, let's enable it first.")}
        </Message>
      </If>
      <If condition={canaryDeployDefinition}>
        {canSetting && (
          <div className="canary-step-setting">
            <Message type="help" style={{ marginBottom: 'var(--spacing-4)' }}>
              {i18n.t('You can also edit the workflow directly to switch to canary deploy mode.')}
            </Message>
            <Form>
              {deploySteps.map((step) => {
                return (
                  <div className="canary-step" key={step.name}>
                    <div className="source">
                      <Row wrap>
                        <Col span={24}>
                          <Item labelWidth={70} label="Name" value={step.name}></Item>
                        </Col>
                        <Col span={24}>
                          <Item labelWidth={70} label="Alias" value={step.alias}></Item>
                        </Col>
                        <Col span={24}>
                          <Item
                            labelWidth={70}
                            label="Policies"
                            value={(step.properties && step.properties['policies']) || []}
                          ></Item>
                        </Col>
                      </Row>
                    </div>
                    <div className="target">
                      <Form.Item required label={i18n.t('Batch Setting').toString()} style={{ width: '100%' }}>
                        <Row wrap>
                          <Col span={24}>
                            <NumberPicker
                              onChange={(v: number) => {
                                deployBatchConfig[step.name] = v;
                                setDeployBatchConfig(deployBatchConfig);
                              }}
                              defaultValue={initBatch}
                              max={4}
                              min={1}
                            ></NumberPicker>
                          </Col>
                        </Row>
                      </Form.Item>
                    </div>
                  </div>
                );
              })}
            </Form>
          </div>
        )}
        {!canSetting && <Message type="warning">{i18n.t('There is no deploy steps exist.')}</Message>}
      </If>
    </Dialog>
  );
};
