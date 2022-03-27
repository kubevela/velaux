import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Grid, Breadcrumb } from '@b-design/ui';
import { Link } from 'dva/router';
import Translation from '../../components/Translation';
import './index.less';
import type { ProjectDetail } from '../../interface/project';

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
};

@connect((store: any) => {
  return { ...store.project };
})
class ProjectLayout extends Component<Props> {
  componentDidMount() {
    this.loadProjectDetail();
  }

  loadProjectDetail = async () => {
    const { params = { projectName: '' } } = this.props.match;
    this.props.dispatch({
      type: 'project/getProjectDetails',
      payload: { projectName: params.projectName },
    });
  };

  getNavList = () => {
    const { params = { projectName: '' } } = this.props.match;
    const { projectName } = params;
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
      {
        id: 'roles',
        name: <Translation>Roles</Translation>,
        to: `/projects/${projectName}/roles`,
      },
      {
        id: 'members',
        name: <Translation>Members</Translation>,
        to: `/projects/${projectName}/members`,
      },
    ];

    const nav = list.map((item) => {
      const active = this.props.activeId === item.id ? 'active' : '';
      return (
        <li className={active}>
          <Link to={item.to}> {item.name}</Link>
        </li>
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
