import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { getApplicationList } from '../../api/application';
import { getProjectRoles, getProjectTargetList, getProjectUsers } from '../../api/project';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { LoginUserInfo, Project, Target, User } from '@velaux/data';
import { checkPermission } from '../../utils/permission';

import ConfigDistributionPage from './components/ConfigDistribution';
import Configs from './components/Configs';
import General from './components/General';
import Targets from './components/Targets';
import './index.less';

type Props = {
  projectDetails: Project;
  userInfo?: LoginUserInfo;
  location: any;
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: Dispatch<any>;
};
type State = {
  userList: User[];
  targets: Target[];
  targetsLoading: boolean;
  applicationCount?: number;
  roleCount?: number;
  memberCount?: number;
};
@connect((store: any) => {
  return { ...store.project, userInfo: store.user?.userInfo };
})
class Summary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      userList: [],
      targets: [],
      targetsLoading: false,
    };
  }

  componentDidMount() {
    this.loadCounts(this.projectName());
  }

  componentDidUpdate(prev: Props) {
    if (
      prev.match.params.projectName !== this.props.match.params.projectName ||
      prev.userInfo !== this.props.userInfo
    ) {
      this.loadCounts(this.projectName());
    }
  }

  projectName = () => {
    const { params = { projectName: '' } } = this.props.match;
    return params.projectName;
  };

  // loadCounts reads the targets and the counts the tiles show, each only where its tab would be shown.
  loadCounts = (projectName: string) => {
    const { userInfo } = this.props;
    this.setState({ targetsLoading: true, applicationCount: undefined, roleCount: undefined, memberCount: undefined });
    getProjectTargetList({ projectName })
      .then((res) => {
        this.setState({ targets: (res && res.targets) || [] });
      })
      .finally(() => {
        this.setState({ targetsLoading: false });
      });
    getApplicationList({ project: projectName })
      .then((res) => {
        if (res) {
          this.setState({ applicationCount: (res.applications || []).length });
        }
      })
      .catch(() => {});
    if (checkPermission({ resource: `project:${projectName}/role:*`, action: 'list' }, projectName, userInfo)) {
      getProjectRoles({ projectName })
        .then((res) => {
          if (res) {
            this.setState({ roleCount: (res.roles || []).length });
          }
        })
        .catch(() => {});
    }
    if (checkPermission({ resource: `project:${projectName}/projectUser:*`, action: 'list' }, projectName, userInfo)) {
      getProjectUsers({ projectName, page: 1, pageSize: 1 })
        .then((res) => {
          if (res) {
            this.setState({ memberCount: res.total ?? (res.users || []).length });
          }
        })
        .catch(() => {});
    }
  };

  loadProjectDetail = async () => {
    this.props.dispatch({
      type: 'project/getProjectDetails',
      payload: { projectName: this.projectName() },
    });
  };

  render() {
    const { userList, targets, targetsLoading, applicationCount, roleCount, memberCount } = this.state;
    const { projectDetails, userInfo } = this.props;
    const projectName = this.projectName();
    const stats = [
      { n: applicationCount, label: 'Applications', to: `/projects/${projectName}/applications`, show: true },
      { n: targetsLoading ? undefined : targets.length, label: 'Targets', to: '/targets', show: true },
      {
        n: roleCount,
        label: 'Roles',
        to: `/projects/${projectName}/roles`,
        show: checkPermission({ resource: `project:${projectName}/role:*`, action: 'list' }, projectName, userInfo),
      },
      {
        n: memberCount,
        label: 'Members',
        to: `/projects/${projectName}/members`,
        show: checkPermission(
          { resource: `project:${projectName}/projectUser:*`, action: 'list' },
          projectName,
          userInfo
        ),
      },
    ];
    return (
      <div id={projectName} className="project-summary">
        <General
          projectDetails={projectDetails}
          userList={userList}
          loadProjectDetail={this.loadProjectDetail}
          projectName={projectName}
        />
        <div className="project-summary-stats">
          {stats
            .filter((stat) => stat.show)
            .map((stat) => (
              <Link key={stat.label} className="project-summary-stat" to={stat.to}>
                <span className="project-summary-stat-n">{stat.n ?? '-'}</span>
                <Translation>{stat.label}</Translation>
              </Link>
            ))}
        </div>
        <Targets projectName={projectName} list={targets} isLoading={targetsLoading} dispatch={this.props.dispatch} />
        <Permission project={projectName} request={{ resource: `project:${projectName}/config:*`, action: 'list' }}>
          <Configs projectName={projectName} />
        </Permission>
        <Permission
          project={projectName}
          request={{ resource: `project:${projectName}/config:*`, action: 'distribute' }}
        >
          <ConfigDistributionPage projectName={projectName} />
        </Permission>
      </div>
    );
  }
}

export default Summary;
