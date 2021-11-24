import React from 'react';
import { Dialog, Table, Card, Step, Loading, Button } from '@b-design/ui';
import { connect } from 'dva';
import type { ApplicationStatus, Condition } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';

type Props = {
  applicationStatus?: ApplicationStatus;
  onClose: () => void;
  dispatch: ({}) => void;
  appName: string;
  envName: string;
};

type State = {
  loading: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class StatusShow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
    };
  }
  componentDidMount = async () => {
    this.loadApplicationStatus();
  };

  loadApplicationStatus = async () => {
    const { appName, envName } = this.props;
    if (envName) {
      this.setState({ loading: true });
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
        callback: () => {
          this.setState({ loading: false });
        },
      });
    }
  };

  render() {
    const { applicationStatus, onClose } = this.props;
    const { loading } = this.state;
    const getCurrent = (conditions?: Condition[]) => {
      let index = 0;
      conditions?.map((condition: Condition, i: number) => {
        if (condition.status == 'False') {
          index = i;
        }
      });
      if (index == 0 && conditions) {
        return conditions.length;
      }
      return index;
    };
    return (
      <Dialog
        visible={true}
        className={'commonDialog'}
        title={<Translation>Application Status</Translation>}
        autoFocus={true}
        style={{ width: '800px' }}
        onClose={onClose}
        footer={
          <div className="next-dialog-footer">
            <Button onClick={onClose}>
              <Translation>Close</Translation>
            </Button>
            <Button type="primary" onClick={this.loadApplicationStatus}>
              <Translation>Update</Translation>
            </Button>
          </div>
        }
        height="auto"
        footerAlign="center"
      >
        <Loading visible={loading} style={{ width: '100%' }}>
          <Card contentHeight="200px" title={<Translation>Applied Resources</Translation>}>
            <Table dataSource={applicationStatus?.appliedResources}>
              <Table.Column dataIndex="kind" title={<Translation>Kind</Translation>} />
              <Table.Column dataIndex="apiVersion" title={<Translation>APIVersion</Translation>} />
              <Table.Column dataIndex="cluster" title={<Translation>Cluster</Translation>} />
              <Table.Column dataIndex="name" title={<Translation>Name</Translation>} />
              <Table.Column dataIndex="namespace" title={<Translation>Namespace</Translation>} />
            </Table>
          </Card>
          <If condition={applicationStatus?.conditions}>
            <Card style={{ marginTop: '8px' }} title={<Translation>Deploy Progress</Translation>}>
              <Step current={getCurrent(applicationStatus?.conditions)}>
                {applicationStatus?.conditions.map((condition) => {
                  return <Step.Item title={condition.type} content={condition.reason} />;
                })}
              </Step>
            </Card>
          </If>
        </Loading>
      </Dialog>
    );
  }
}

export default StatusShow;
