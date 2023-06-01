import { Button, Dialog, Message, Table } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { AiFillDelete } from 'react-icons/ai';
import type { Dispatch } from 'redux';

import { deleteWorkflow } from '../../api/workflows';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { ApplicationDetail, EnvBinding, Workflow } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';

type Props = {
  revisions: [];
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  workflows: Workflow[];
  dispatch: Dispatch<any>;
  match: {
    params: {
      appName: string;
    };
  };
};

type State = {};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationWorkflowList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  loadApplicationWorkflows = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationWorkflows',
      payload: { appName: appName },
    });
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
              Message.success(i18n.t('Workflow removed successfully'));
              this.loadApplicationWorkflows();
            }
          });
        },
        locale: locale().Dialog,
      });
    }
  };

  render() {
    const { applicationDetail, workflows } = this.props;
    const projectName = applicationDetail?.project?.name;
    return (
      <div>
        <Table dataSource={workflows}>
          <Table.Column
            dataIndex="name"
            title={i18n.t('Name').toString()}
            cell={(v: string, i: number, w: Workflow) => {
              return (
                <Link to={`/applications/${applicationDetail?.name}/envbinding/${w.envName}/workflow/${v}/studio`}>
                  {v}
                </Link>
              );
            }}
          />
          <Table.Column
            dataIndex="envName"
            title={i18n.t('Environment').toString()}
            cell={(v: string) => {
              return <Link to={`/applications/${applicationDetail?.name}/envbinding/${v}/workflow`}>{v}</Link>;
            }}
          />
          <Table.Column dataIndex="mode" title={i18n.t('Mode').toString()} />
          <Table.Column
            dataIndex="steps"
            title={i18n.t('Step Count').toString()}
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
                  <If condition={v != 'workflow-' + w.envName}>
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
