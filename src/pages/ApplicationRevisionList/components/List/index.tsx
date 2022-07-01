import React, { Component } from 'react';
import { Balloon, Table } from '@b-design/ui';
import Empty from '../Empty';
import Translation from '../../../../components/Translation';
import type { ApplicationDetail, ApplicationRevision } from '../../../../interface/application';
import { statusList } from '../../constants';
import { momentDate } from '../../../../utils/common';
import { Link } from 'dva/router';
import './index.less';
import locale from '../../../../utils/locale';
import Item from '../../../../components/Item';

type Props = {
  list: ApplicationRevision[];
  getRevisionList: () => void;
  applicationDetail?: ApplicationDetail;
  onShowAppModel: (record: ApplicationRevision) => void;
};

type State = {};

class TableList extends Component<Props, State> {
  //Todo
  onRollback = (record: ApplicationRevision) => {
    console.log(record);
  };

  getColumns = () => {
    const { applicationDetail } = this.props;
    return [
      {
        key: 'version',
        title: <Translation>Revision</Translation>,
        dataIndex: 'version',
        cell: (v: string, i: number, record: ApplicationRevision) => {
          if (record.codeInfo) {
            return (
              <Balloon style={{ width: '220px' }} trigger={<a>{v}</a>}>
                <Item
                  label="Commit"
                  value={
                    <a title={record.codeInfo.commit}>{record.codeInfo.commit?.slice(0, 7)}</a>
                  }
                />
                <Item label="Branch" value={record.codeInfo.branch} />
                <Item label="User" value={record.codeInfo.user} />
              </Balloon>
            );
          }
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string, i: number, record: ApplicationRevision) => {
          const findObj = statusList.find((item) => item.value === v);
          if (findObj) {
            return (
              <div title={record.reason}>
                {v === 'failure' && <span className="circle circle-failure" />}
                {v === 'terminated' && <span className="circle circle-warning" />}
                <Translation>{findObj.label}</Translation>
              </div>
            );
          }
          return '';
        },
      },
      {
        key: 'triggerType',
        title: <Translation>Trigger Type</Translation>,
        dataIndex: 'triggerType',
      },
      {
        key: 'createTime',
        title: <Translation>Publish Time</Translation>,
        dataIndex: 'createTime',
        cell: (v: string) => {
          return <span>{v && momentDate(v)}</span>;
        },
      },
      {
        key: 'envName',
        title: <Translation>Environment</Translation>,
        dataIndex: 'envName',
        cell: (v: string) => {
          return (
            <span>
              <Link
                to={`/applications/${
                  applicationDetail && applicationDetail.name
                }/envbinding/${v}/status`}
              >
                {v}
              </Link>
            </span>
          );
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: ApplicationRevision) => {
          return (
            <div>
              <a onClick={() => this.props.onShowAppModel(record)}>
                <Translation>Detail</Translation>
              </a>
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const columns = this.getColumns();
    const { list } = this.props;
    return (
      <div className="table-version-list  margin-top-20">
        <Table
          locale={locale().Table}
          primaryKey={'version'}
          className="customTable"
          rowHeight={40}
          dataSource={list}
          hasBorder={false}
          loading={false}
          emptyContent={<Empty />}
        >
          {columns && columns.map((col) => <Column {...col} key={col.key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
