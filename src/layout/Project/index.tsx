import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import Title from '../../components/ListTitle';
import Translation from '../../components/Translation';
import './index.less';

type Props = {
  activeId: string;
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: ({}) => {};
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

  shouldComponentUpdate(nextProps: any) {
    return nextProps.location !== this.props.location;
  }

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
    return (
      <Fragment>
        <Title title="Projects" subTitle="Projects are used to allocate and isolate resources" />
        <nav className="project-detail-wrapper">
          <ul>{menu}</ul>
        </nav>
        {this.props.children}
      </Fragment>
    );
  }
}

export default ProjectLayout;
