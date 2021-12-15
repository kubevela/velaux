import React from 'react';
import { Table, Card, Step } from '@b-design/ui';
import type { ApplicationStatus, Condition } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';
import locale from '../../../../utils/locale';

type Props = {
  applicationStatus?: ApplicationStatus;
};

export default function Status(props: Props) {
  const { applicationStatus } = props;
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
        }
      });
    });
    if (index == 0 && conditions) {
      return conditions.length;
    }
    return index;
  };
  return (
    <div>
      <Card
        locale={locale.Card}
        contentHeight="200px"
        title={<Translation>Applied Resources</Translation>}
      >
        <Table locale={locale.Table} dataSource={applicationStatus?.appliedResources}>
          <Table.Column dataIndex="kind" title={<Translation>Kind</Translation>} />
          <Table.Column dataIndex="apiVersion" title={<Translation>APIVersion</Translation>} />
          <Table.Column dataIndex="cluster" title={<Translation>Cluster</Translation>} />
          <Table.Column dataIndex="name" title={<Translation>Name</Translation>} />
          <Table.Column dataIndex="namespace" title={<Translation>Namespace</Translation>} />
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
              return <Step.Item title={condition.type} content={condition.reason} />;
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
              width="150px"
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
    </div>
  );
}
