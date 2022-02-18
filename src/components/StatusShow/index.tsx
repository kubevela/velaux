import React from 'react';
import { Dialog, Table, Card, Loading, Button, Balloon, Icon } from '@b-design/ui';
import type { ApplicationStatus, Condition } from '../../interface/application';
import Translation from '../../components/Translation';
import { If } from 'tsx-control-statements/components';
import locale from '../../utils/locale';
import { Link } from 'dva/router';

type Props = {
  loading: boolean;
  title: JSX.Element;
  applicationStatus?: ApplicationStatus;
  onClose: () => void;
  loadStatusDetail: () => void;
};

class StatusShow extends React.Component<Props> {
  render() {
    const { applicationStatus, onClose, loading, title } = this.props;
    return (
      <Dialog
        locale={locale.Dialog}
        visible={true}
        className={'commonDialog'}
        title={title}
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
              contentHeight="auto"
              title={<Translation>Conditions</Translation>}
            >
              <Table locale={locale.Table} dataSource={applicationStatus?.conditions}>
                <Table.Column
                  width="150px"
                  dataIndex="type"
                  title={<Translation>Type</Translation>}
                />
                <Table.Column dataIndex="status" title={<Translation>Status</Translation>} />

                <Table.Column
                  dataIndex="lastTransitionTime"
                  title={<Translation>LastTransitionTime</Translation>}
                />
                <Table.Column
                  dataIndex="reason"
                  title={<Translation>Reason</Translation>}
                  cell={(v: string, index: number, row: Condition) => {
                    if (row.message) {
                      return (
                        <Balloon
                          trigger={
                            <span style={{ color: 'red', cursor: 'pointer' }}>
                              {v} <Icon size={'xs'} type="question-circle" />
                            </span>
                          }
                        >
                          {row.message}
                        </Balloon>
                      );
                    }
                    return <span>{v}</span>;
                  }}
                />
              </Table>
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
