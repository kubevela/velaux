import React, { Component } from 'react';
import { Table, Message } from '@b-design/ui';
import Empty from '../Empty';
import Translation from '../../../../components/Translation';
import { Revisions, } from '../../../../interface/application';
import { statusList } from '../../constants';
import { momentDate } from '../../../../utils/common';
import './index.less';


type Props = {
  list: Array<Revisions>;
  getRevisionList: () => void;
};

type State = {};

class TableList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  //Todo
  onRollback = (record: Revisions) => {

  };


  getCloumns = () => {
    return [
      {
        key: 'version',
        title: <Translation>Release Number</Translation>,
        dataIndex: 'version',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Publish Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          const findObj = statusList.find(item => item.value === v)
          return <span>{findObj && findObj.label}</span>;
        },
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
        title: <Translation>Publish Environment</Translation>,
        dataIndex: 'envName',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Revisions) => {
          return (
            <div>
              <a
                onClick={() => {
                  this.onRollback(record);
                }}
              >
                <Translation>Rollback</Translation>
              </a>
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const columns = this.getCloumns();
    const { list } = this.props;
    console.log('list', list)
    return (
      <div className="table-version-list  margin-top-20">
        <Table
          dataSource={list}
          hasBorder={false}
          loading={false}
          emptyContent={<Empty />}
        >
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default TableList;
