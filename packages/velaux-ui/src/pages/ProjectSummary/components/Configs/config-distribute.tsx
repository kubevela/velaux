import { Message, Grid, Dialog, Form, Field, Select } from '@alifd/next';
import React from 'react';

import './index.less';
import { applyProjectConfigDistribution } from '../../../../api/config';
import { getProjectTargetList } from '../../../../api/project';
import { Translation } from '../../../../components/Translation';
import type { NamespacedName, TargetCluster, TargetClusterStatus , Target } from '@velaux/data';
import { locale } from '../../../../utils/locale';
const { Col, Row } = Grid;

type Props = {
  config: NamespacedName;
  targets?: TargetClusterStatus[];
  projectName: string;
  onSuccess: () => void;
  onClose: () => void;
};

type State = {
  targetOptions?: Target[];
};

class DistributeConfigDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {};
  }

  componentDidMount() {
    this.loadTargets();
  }

  loadTargets = () => {
    const { projectName } = this.props;
    getProjectTargetList({ projectName: projectName }).then((res) => {
      if (res && Array.isArray(res.targets)) {
        this.setState({ targetOptions: res.targets });
      } else {
        this.setState({ targetOptions: [] });
      }
    });
  };

  onClose = () => {
    this.props.onClose();
  };

  onOk = () => {
    const { projectName, config } = this.props;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { targets } = values;
      const applyTargets: TargetCluster[] = [];
      targets.map((t: string) => {
        if (t && t.includes('/')) {
          applyTargets.push({
            clusterName: t.split('/')[0],
            namespace: t.split('/')[1],
          });
        }
      });
      applyProjectConfigDistribution(projectName, {
        name: 'distribute-' + config.name,
        targets: applyTargets,
        configs: [config],
      }).then(() => {
        Message.success(<Translation>Config distributed successfully</Translation>);
        this.props.onSuccess();
      });
    });
  };
  render() {
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };
    const init = this.field.init;
    const { targets } = this.props;
    const { targetOptions } = this.state;
    const options = targetOptions?.map((target) => {
      const key = target.cluster?.clusterName + '/' + target.cluster?.namespace;
      return {
        label: `${target.alias || target.name}(${key})`,
        value: key,
      };
    });
    return (
      <Dialog
        locale={locale().Dialog}
        v2
        title={<Translation>Distribute the config</Translation>}
        overflowScroll={true}
        autoFocus={true}
        visible={true}
        onOk={this.onOk}
        onCancel={this.onClose}
        onClose={this.onClose}
        footerActions={['ok']}
        footerAlign="center"
      >
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={24}>
              <FormItem label={<Translation>Targets</Translation>} required>
                <Select
                  multiple
                  name="name"
                  locale={locale().Select}
                  dataSource={options}
                  {...init('targets', {
                    initValue: targets?.map((t) => {
                      return `${t.clusterName}/${t.namespace}`;
                    }),
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Dialog>
    );
  }
}

export default DistributeConfigDialog;
