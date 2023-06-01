import { Balloon, Button, Dialog, Dropdown, Menu, Message, Table } from '@alifd/next';

import Empty from '../Empty';

import { Link, routerRedux } from 'dva/router';
import React, { Component } from 'react';

import './index.less';
import type { Dispatch } from 'redux';

import { compareApplication, rollbackWithRevision } from '../../../../api/application';
import { ApplicationDiff } from '../../../../components/ApplicationDiff';
import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type {
  ApplicationCompareRequest,
  ApplicationCompareResponse,
  ApplicationDetail,
  ApplicationRevision,
  ApplicationRollbackResponse,
 NameAlias } from '@velaux/data';
import { momentDate, showAlias } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { statusList } from '../../constants';

type Props = {
  list: ApplicationRevision[];
  getRevisionList: () => void;
  applicationDetail?: ApplicationDetail;
  onShowAppModel: (record: ApplicationRevision) => void;
  dispatch: Dispatch<any>;
};

type State = {
  compare?: ApplicationCompareResponse;
  revision?: ApplicationRevision;
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

  onRollback = (record: ApplicationRevision, ok?: boolean) => {
    const { applicationDetail, dispatch } = this.props;
    if (record.status === 'terminated' && !ok) {
      Dialog.confirm({
        type: 'confirm',
        content: (
          <Translation>This revision status is terminated, are you sure to rollback to this revision?</Translation>
        ),
        onOk: () => {
          this.onRollback(record, true);
        },
        locale: locale().Dialog,
      });
      return;
    }
    if (applicationDetail) {
      rollbackWithRevision({ appName: applicationDetail?.name, revision: record.version }).then(
        (res: ApplicationRollbackResponse) => {
          if (res) {
            Message.success('Application rollback successfully');
            if (res.record && res.record.name && dispatch) {
              dispatch(
                routerRedux.push(
                  `/applications/${applicationDetail.name}/envbinding/${record.envName}/workflow/records/${res.record.name}`
                )
              );
            }
          }
        }
      );
    }
  };

  loadChanges = (revision: ApplicationRevision, mode: 'latest' | 'cluster') => {
    const { applicationDetail } = this.props;
    if (!revision || !applicationDetail) {
      this.setState({ compare: undefined });
      return;
    }
    let params: ApplicationCompareRequest = {
      compareRevisionWithLatest: { revision: revision.version },
    };
    if (mode === 'cluster') {
      params = {
        compareRevisionWithRunning: { revision: revision.version },
      };
    }
    compareApplication(applicationDetail?.name, params).then((res: ApplicationCompareResponse) => {
      this.setState({
        revision: revision,
        compare: res,
        visibleApplicationDiff: true,
        diffMode: mode,
      });
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
                  value={<a title={record.codeInfo.commit}>{record.codeInfo.commit?.slice(0, 7)}</a>}
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
        key: 'deployUser',
        title: <Translation>Deploy User</Translation>,
        dataIndex: 'deployUser',
        cell: (v: NameAlias) => {
          return showAlias(v.name, v.alias);
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
                {v === 'complete' && <span className="circle circle-success" />}
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
              <Link to={`/applications/${applicationDetail && applicationDetail.name}/envbinding/${v}/status`}>
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
              <Permission
                project={applicationDetail?.project?.name}
                request={{
                  resource: `project:${applicationDetail?.project?.name}/application:${applicationDetail?.name}`,
                  action: 'detail',
                }}
              >
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.props.onShowAppModel(record);
                  }}
                >
                  <Translation>Detail</Translation>
                </Button>
              </Permission>
              <span className="line" />
              <Dropdown
                trigger={
                  <Button text size={'medium'} component={'a'}>
                    <Translation>Diff</Translation>
                  </Button>
                }
              >
                <Menu>
                  <Menu.Item
                    onClick={() => {
                      this.loadChanges(record, 'cluster');
                    }}
                  >
                    <Translation>Diff With Deployed Application</Translation>
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => {
                      this.loadChanges(record, 'latest');
                    }}
                  >
                    <Translation>Diff With Latest Configuration</Translation>
                  </Menu.Item>
                </Menu>
              </Dropdown>
              <span className="line" />

              <If condition={record.status === 'complete' || record.status == 'terminated'}>
                <Permission
                  project={applicationDetail?.project?.name}
                  request={{
                    resource: `project:${applicationDetail?.project?.name}/application:${applicationDetail?.name}/revision:${record.version}`,
                    action: 'rollback',
                  }}
                >
                  <Button
                    text
                    size={'medium'}
                    component={'a'}
                    onClick={() => {
                      this.onRollback(record);
                    }}
                  >
                    <Translation>Rollback</Translation>
                  </Button>
                </Permission>
              </If>
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
    const { visibleApplicationDiff, compare, diffMode, revision } = this.state;
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
                this.setState({
                  visibleApplicationDiff: false,
                  compare: undefined,
                  revision: undefined,
                });
              }}
              rollback2Revision={
                diffMode === 'cluster' && revision
                  ? () => {
                      this.onRollback(revision);
                    }
                  : undefined
              }
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
