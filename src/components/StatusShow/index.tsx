import React from 'react';
import { Dialog, Table, Card, Step, Loading, Button, Balloon } from '@b-design/ui';
import type { ApplicationStatus, Condition } from '../../interface/application';
import Translation from '../../components/Translation';
import { If } from 'tsx-control-statements/components';
import locale from '../../utils/locale';
import { Link } from 'dva/router';

type Props = {
  loading: boolean;
  applicationStatus?: ApplicationStatus;
  onClose: () => void;
  loadStatusDetail: () => void;
};

class StatusShow extends React.Component<Props> {
  render() {
    const { applicationStatus, onClose, loading } = this.props;
    const allConditions: Condition[] = [
      { type: 'Parsed', status: 'False' },
      { type: 'Revision', status: 'False' },
      { type: 'Policy', status: 'False' },
      { type: 'Render', status: 'False' },
      { type: 'WorkflowFinished', status: 'False' },
      { type: 'Ready', status: 'False' },
    ];
    const getCurrent = (conditions?: Condition[]) => {
      let index = 0;
      conditions?.map((condition: Condition, i: number) => {
        if (condition.status == 'False') {
          index = i;
        }
        allConditions.map((c) => {
          if (c.type == condition.type) {
            c.status = condition.status;
            c.lastTransitionTime = condition.lastTransitionTime;
            c.reason = condition.reason;
            c.message = condition.message;
          }
        });
        if (condition.type == 'Deleting') {
          allConditions.push(condition);
        }
      });
      if (index == 0 && conditions) {
        return conditions.length;
      }
      return index;
    };
    return (
      <Dialog
        locale={locale.Dialog}
        visible={true}
        className={'commonDialog'}
        title={<Translation>Application Status</Translation>}
        autoFocus={true}
        isFullScreen={true}
        style={{ width: '800px' }}
        onClose={onClose}
        footer={
          <div className="next-dialog-footer">
            <Button onClick={onClose}>
              <Translation>Close</Translation>
            </Button>
            <Button type="primary" onClick={this.props.loadStatusDetail}>
              <Translation>Refresh</Translation>
            </Button>
          </div>
        }
        height="auto"
        footerAlign="center"
      >
        <Loading visible={loading} style={{ width: '100%' }}>
          <Card
            locale={locale.Card}
            contentHeight="200px"
            title={<Translation>Applied Resources</Translation>}
          >
            <Table locale={locale.Table} dataSource={applicationStatus?.appliedResources}>
              <Table.Column
                width="150px"
                dataIndex="kind"
                title={<Translation>Kind</Translation>}
              />
              <Table.Column dataIndex="apiVersion" title={<Translation>APIVersion</Translation>} />
              <Table.Column
                dataIndex="cluster"
                title={<Translation>Cluster</Translation>}
                width="150px"
                cell={(v: string) => {
                  if (!v) {
                    return <Link to="/clusters">Local</Link>;
                  }
                  return <Link to="/clusters">{v}</Link>;
                }}
              />
              <Table.Column dataIndex="name" title={<Translation>Name</Translation>} />
              <Table.Column
                width="100px"
                dataIndex="namespace"
                title={<Translation>Namespace</Translation>}
              />
            </Table>
          </Card>
          <If condition={applicationStatus?.conditions}>
            <Card
              locale={locale.Card}
              style={{ marginTop: '8px' }}
              title={<Translation>Progress</Translation>}
            >
              <Step current={getCurrent(applicationStatus?.conditions)}>
                {allConditions.map((condition) => {
                  const content = condition.message ? (
                    <Balloon
                      trigger={
                        <span style={{ cursor: 'pointer', color: '#1b58f4' }}>
                          {condition.reason}
                        </span>
                      }
                    >
                      {condition.message}
                    </Balloon>
                  ) : (
                    condition.reason
                  );
                  return <Step.Item title={condition.type} content={content} />;
                })}
              </Step>
            </Card>
          </If>
          <If condition={applicationStatus?.services}>
            <Card
              locale={locale.Card}
              style={{ marginTop: '8px', marginBottom: '16px' }}
              contentHeight="auto"
              title={<Translation>Component Status</Translation>}
            >
              <Table
                locale={locale.Table}
                className="customTable"
                dataSource={applicationStatus?.services}
              >
                <Table.Column
                  align="left"
                  dataIndex="name"
                  width="200px"
                  title={<Translation>Name</Translation>}
                />
                <Table.Column
                  align="left"
                  dataIndex="healthy"
                  width="100px"
                  cell={(v: boolean) => {
                    if (v) {
                      return (
                        <div>
                          <span className="circle circle-success" />
                          <span>Healthy</span>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <span className="circle circle-warning" />
                        <span>UnHealthy</span>
                      </div>
                    );
                  }}
                  title={<Translation>Healthy</Translation>}
                />
                <Table.Column
                  align="center"
                  dataIndex="message"
                  title={<Translation>Message</Translation>}
                />
              </Table>
            </Card>
          </If>
        </Loading>
      </Dialog>
    );
  }
}

export default StatusShow;
