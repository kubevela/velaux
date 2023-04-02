import { Button, Dialog, Message, Table } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { AiFillDelete } from 'react-icons/ai';
import type { Dispatch } from 'redux';

import { deleteWorkflow, listWorkflow } from '../../api/workflows';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { ApplicationDetail, EnvBinding, Workflow } from '../../interface/application';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';

type Props = {
  revisions: [];
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  dispatch: Dispatch<any>;
  match: {
    params: {
      appName: string;
    };
  };
};

type State = {
  workflowList: Workflow[];
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationWorkflowList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      workflowList: [],
    };
  }

  componentDidMount() {
    this.getWorkflowList();
  }

  getWorkflowList = async () => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      const params = {
        appName: applicationDetail?.name,
      };

      listWorkflow(params).then((res) => {
        if (res) {
          this.setState({
            workflowList: res.workflows || [],
          });
        }
      });
    }
  };

  onDeleteWorkflow = (name: string) => {
    const { applicationDetail } = this.props;
    if (applicationDetail) {
      Dialog.confirm({
        type: 'confirm',
        content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
        onOk: () => {
          deleteWorkflow({
            appName: applicationDetail.name,
            name: name,
          }).then((res) => {
            if (res) {
              Message.success(i18n.t('The Workflow removed successfully'));
              this.getWorkflowList();
            }
          });
        },
        locale: locale().Dialog,
      });
    }
  };

  render() {
    const { workflowList } = this.state;
    const { applicationDetail } = this.props;
    const projectName = applicationDetail?.project?.name;
    return (
      <div>
        <Message type="notice" style={{ marginBottom: '8px' }}>
          <Translation>One environment corresponds to one workflow</Translation>
        </Message>
        <Table dataSource={workflowList}>
          <Table.Column dataIndex="name" title={i18n.t('Name').toString()} />
          <Table.Column
            dataIndex="envName"
            title={i18n.t('Environment').toString()}
            cell={(v: string) => {
              return <Link to={`/applications/${applicationDetail?.name}/envbinding/${v}/workflow/studio`}>{v}</Link>;
            }}
          />
          <Table.Column dataIndex="mode" title={i18n.t('Mode').toString()} />
          <Table.Column
            dataIndex="steps"
            title={i18n.t('Step Number').toString()}
            cell={(steps: []) => {
              return steps ? steps.length : 0;
            }}
          />
          <Table.Column
            dataIndex="createTime"
            title={i18n.t('Create Time').toString()}
            cell={(v: string) => {
              return momentDate(v);
            }}
          />
          <Table.Column
            dataIndex="updateTime"
            title={i18n.t('Update Time').toString()}
            cell={(v: string) => {
              return momentDate(v);
            }}
          />
          <Table.Column
            dataIndex="name"
            title={i18n.t('Action').toString()}
            cell={(v: string, i: number, w: Workflow) => {
              return (
                <div>
                  <If condition={v === w.envName + '-workflow'}>
                    <Permission
                      project={projectName}
                      resource={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/workflow:${v}`,
                        action: 'delete',
                      }}
                    >
                      <Button
                        text
                        size={'medium'}
                        className={'danger-btn'}
                        component={'a'}
                        onClick={() => {
                          this.onDeleteWorkflow(v);
                        }}
                      >
                        <AiFillDelete />
                        <Translation>Remove</Translation>
                      </Button>
                    </Permission>
                  </If>
                </div>
              );
            }}
          />
        </Table>
      </div>
    );
  }
}

export default ApplicationWorkflowList;
