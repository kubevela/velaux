import { Button, Table } from '@alifd/next';
import { routerRedux } from 'dva/router';
import React from 'react';
import type { Dispatch } from 'redux';

import { AliasName } from '../../../../components/AliasName';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { Target } from '@velaux/data';
import { locale } from '../../../../utils/locale';

type Props = {
  projectName: string;
  list: Target[];
  isLoading: boolean;
  dispatch: Dispatch<any>;
};

// Targets lists the project's delivery targets.
const Targets = (props: Props) => {
  const { projectName, list, isLoading } = props;
  return (
    <div>
      <div className="summary-section-head">
        <span className="summary-section-title">
          <Translation>Targets</Translation>
        </span>
        <Permission request={{ resource: `target:*`, action: 'create' }} project={projectName}>
          <Button onClick={() => props.dispatch(routerRedux.push('/targets'))}>
            <Translation>Add</Translation>
          </Button>
        </Permission>
      </div>
      <Table locale={locale().Table} dataSource={list} loading={isLoading}>
        <Table.Column
          key="name"
          title={<Translation>Name</Translation>}
          dataIndex="name"
          cell={(v: string, i: number, record: Target) => <AliasName name={v} alias={record.alias} />}
        />
        <Table.Column
          key="cluster"
          title={<Translation>Cluster/Namespace</Translation>}
          dataIndex="cluster"
          cell={(v: Target['cluster']) => <span>{v ? `${v.clusterName}/${v.namespace}` : '-'}</span>}
        />
        <Table.Column
          key="description"
          title={<Translation>Description</Translation>}
          dataIndex="description"
          cell={(v: string) => <span>{v}</span>}
        />
      </Table>
    </div>
  );
};

export default Targets;
