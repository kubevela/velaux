import { connect } from 'dva';
import React, { Component, Fragment } from 'react';

import { Translation } from '../../components/Translation';
import { PageHeader } from '../../components/PageHeader';
import { PageTab, PageTabs } from '../../components/PageTabs';
import type { ProjectDetail, LoginUserInfo } from '@velaux/data';
import { checkPermission } from '../../utils/permission';

type Props = {
  activeId: string;
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: ({}) => {};
  projectDetails?: ProjectDetail;
  location: any;
  userInfo?: LoginUserInfo;
};

@connect((store: any) => {
  return { ...store.project, ...store.user };
})
class ProjectLayout extends Component<Props> {
  componentDidMount() {
    const { params = { projectName: '' } } = this.props.match;
    this.loadProjectDetail(params.projectName);
  }

  shouldComponentUpdate(nextProps: Props) {
    const change = nextProps.match.params.projectName !== this.props.match.params.projectName;
    if (change) {
      const { params = { projectName: '' } } = nextProps.match;
      this.loadProjectDetail(params.projectName);
    }
    return true;
  }

  loadProjectDetail = async (projectName: string) => {
    this.props.dispatch({
      type: 'project/getProjectDetails',
      payload: { projectName: projectName },
    });
  };

  getNavList = () => {
    const { params = { projectName: '' } } = this.props.match;
    const { projectName } = params;
    const { userInfo } = this.props;
    const list = [
      {
        id: 'summary',
        name: 'Summary',
        to: `/projects/${projectName}/summary`,
      },
      {
        id: 'applications',
        name: 'Applications',
        to: `/projects/${projectName}/applications`,
      },
      {
        id: 'pipelines',
        name: 'Pipelines',
        to: `/projects/${projectName}/pipelines`,
      },
    ];

    if (checkPermission({ resource: `project:${projectName}/role:*`, action: 'list' }, projectName, userInfo)) {
      list.push({
        id: 'roles',
        name: 'Roles',
        to: `/projects/${projectName}/roles`,
      });
    }
    if (checkPermission({ resource: `project:${projectName}/projectUser:*`, action: 'list' }, projectName, userInfo)) {
      list.push({
        id: 'members',
        name: 'Members',
        to: `/projects/${projectName}/members`,
      });
    }

    return list;
  };

  render() {
    const { projectDetails, activeId } = this.props;
    const title = projectDetails?.alias || projectDetails?.name || '';
    const owner = projectDetails?.owner?.alias || projectDetails?.owner?.name;
    return (
      <Fragment>
        <PageHeader
          breadcrumb={[{ to: '/projects', title: 'Projects' }, { title: title }]}
          title={title}
          description={projectDetails?.description}
        >
          {projectDetails?.alias && <span className="page-head-meta">{projectDetails.name}</span>}
          {owner && (
            <span className="page-head-meta">
              <Translation>Owner</Translation>: {owner}
            </span>
          )}
        </PageHeader>
        <PageTabs>
          {this.getNavList().map((item) => (
            <PageTab key={item.id} label={item.name} to={item.to} active={activeId === item.id} />
          ))}
        </PageTabs>
        {this.props.children}
      </Fragment>
    );
  }
}

export default ProjectLayout;
