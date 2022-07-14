import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Grid, Breadcrumb } from '@b-design/ui';
import { Link } from 'dva/router';
import Translation from '../../components/Translation';
import './index.less';
import type { ProjectDetail } from '../../interface/project';
import { checkPermission } from '../../utils/permission';
import type { LoginUserInfo } from '../../interface/user';

const { Row, Col } = Grid;

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
        name: <Translation>Summary</Translation>,
        to: `/projects/${projectName}/summary`,
      },
      {
        id: 'applications',
        name: <Translation>Applications</Translation>,
        to: `/projects/${projectName}/applications`,
      },
    ];

    if (
      checkPermission(
        { resource: `project:${projectName}/role:*`, action: 'list' },
        projectName,
        userInfo,
      )
    ) {
      list.push({
        id: 'roles',
        name: <Translation>Roles</Translation>,
        to: `/projects/${projectName}/roles`,
      });
    }
    if (
      checkPermission(
        { resource: `project:${projectName}/projectUser:*`, action: 'list' },
        projectName,
        userInfo,
      )
    ) {
      list.push({
        id: 'members',
        name: <Translation>Members</Translation>,
        to: `/projects/${projectName}/members`,
      });
    }

    const nav = list.map((item) => {
      const active = this.props.activeId === item.id ? 'active' : '';
      return (
        <Link key={item.id} className={active} to={item.to}>
          {item.name}
        </Link>
      );
    });
    return nav;
  };

  render() {
    const menu = this.getNavList();
    const { projectDetails } = this.props;
    return (
      <Fragment>
        <Row>
          <Col span={6} className="padding16">
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Translation>Projects</Translation>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                {projectDetails && (projectDetails.alias || projectDetails.name)}
              </Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <nav className="project-detail-wrapper">
          <ul>{menu}</ul>
        </nav>
        {this.props.children}
      </Fragment>
    );
  }
}

export default ProjectLayout;
