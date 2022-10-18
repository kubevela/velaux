import React, { Component } from 'react';
import { Balloon, Button, Dropdown, Menu, Table } from '@b-design/ui';
import Empty from '../Empty';
import Translation from '../../../../components/Translation';
import type {
  ApplicationCompareRequest,
  ApplicationCompareResponse,
  ApplicationDetail,
  ApplicationRevision,
} from '../../../../interface/application';
import { statusList } from '../../constants';
import { momentDate } from '../../../../utils/common';
import { Link } from 'dva/router';
import './index.less';
import locale from '../../../../utils/locale';
import Item from '../../../../components/Item';
import { compareApplication } from '../../../../api/application';
import { If } from 'tsx-control-statements/components';
import { ApplicationDiff } from '../../../../components/ApplicationDiff';

type Props = {
  list: ApplicationRevision[];
  getRevisionList: () => void;
  applicationDetail?: ApplicationDetail;
  onShowAppModel: (record: ApplicationRevision) => void;
};

type State = {
  compare?: ApplicationCompareResponse;
  visibleApplicationDiff: boolean;
  diffMode: 'latest' | 'cluster';
};

class TableList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      diffMode: 'latest',
      visibleApplicationDiff: false,
    };
  }

  onRollback = (record: ApplicationRevision) => {
    console.log(record);
  };

  loadChanges = (revision: string, mode: 'latest' | 'cluster') => {
    const { applicationDetail } = this.props;
    if (!revision || !applicationDetail) {
      this.setState({ compare: undefined });
      return;
    }
    let params: ApplicationCompareRequest = {
      compareRevisionWithLatest: { revision: revision },
    };
    if (mode === 'cluster') {
      params = {
        compareRevisionWithRunning: { revision: revision },
      };
    }
    compareApplication(applicationDetail?.name, params).then((res: ApplicationCompareResponse) => {
      this.setState({ compare: res, visibleApplicationDiff: true, diffMode: mode });
    });
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
            const show = (
              <div>
                {v === 'failure' && <span className="circle circle-failure" />}
                {v === 'terminated' && <span className="circle circle-warning" />}
                <Translation>{findObj.label}</Translation>
              </div>
            );
            if (record.reason) {
              return <Balloon trigger={show}>{record.reason}</Balloon>;
            }
            return show;
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
              <Button
                text
                size={'medium'}
                ghost={true}
                component={'a'}
                onClick={() => {
                  this.props.onShowAppModel(record);
                }}
              >
                <Translation>Detail</Translation>
              </Button>
              <span className="line" />
              <Dropdown
                trigger={
                  <Button text size={'medium'} ghost={true} component={'a'}>
                    <Translation>Diff</Translation>
                  </Button>
                }
              >
                <Menu>
                  <Menu.Item
                    onClick={() => {
                      this.loadChanges(record.version, 'cluster');
                    }}
                  >
                    <Translation>Diff With Deployed Application</Translation>
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => {
                      this.loadChanges(record.version, 'latest');
                    }}
                  >
                    <Translation>Diff With Latest Configuration</Translation>
                  </Menu.Item>
                </Menu>
              </Dropdown>
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
    const { visibleApplicationDiff, compare, diffMode } = this.state;
    const baseName = 'Current Revision';
    let targetName = 'Latest Application Configuration';
    if (diffMode == 'cluster') {
      targetName = 'Deployed Application';
    }
    return (
      <div className="table-version-list  margin-top-20" style={{ overflow: 'auto' }}>
        <Table
          locale={locale().Table}
          primaryKey={'version'}
          style={{ minWidth: '1000px' }}
          className="customTable"
          rowHeight={40}
          dataSource={list}
          hasBorder={false}
          loading={false}
          emptyContent={<Empty />}
        >
          {columns.map((col) => (
            <Column {...col} key={col.key} align={'left'} />
          ))}
        </Table>
        <If condition={visibleApplicationDiff}>
          {compare && (
            <ApplicationDiff
              onClose={() => {
                this.setState({ visibleApplicationDiff: false, compare: undefined });
              }}
              baseName={baseName}
              targetName={targetName}
              compare={compare}
            />
          )}
        </If>
      </div>
    );
  }
}

export default TableList;
