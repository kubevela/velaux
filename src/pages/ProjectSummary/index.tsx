import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import type { Project } from '../../interface/project';
import type { User } from '../../interface/user';
import General from './components/General';
import Targets from './components/Targets';
import Configs from './components/Configs';
import Permission from '../../components/Permission';
import ConfigDistributionPage from './components/ConfigDistribution';

type Props = {
  projectDetails: Project;
  location: any;
  match: {
    params: {
      projectName: string;
    };
  };
  dispatch: ({}) => {};
};
type State = {
  userList: User[];
};
@connect((store: any) => {
  return { ...store.project };
})
class Summary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      userList: [],
    };
  }

  loadProjectDetail = async () => {
    const { params = { projectName: '' } } = this.props.match;
    this.props.dispatch({
      type: 'project/getProjectDetails',
      payload: { projectName: params.projectName },
    });
  };

  render() {
    const { userList } = this.state;
    const { match, projectDetails } = this.props;
    const { params = { projectName: '' } } = match;
    return (
      <Fragment>
        <div className="container" id={params.projectName}>
          <General
            projectDetails={projectDetails}
            userList={userList}
            loadProjectDetail={this.loadProjectDetail}
            projectName={params.projectName}
          />
          <Targets projectName={params.projectName} />
          <Permission
            project={params.projectName}
            request={{ resource: `project:${params.projectName}/configs:*`, action: 'list' }}
          >
            <Configs projectName={params.projectName} />
            <ConfigDistributionPage projectName={params.projectName} />
          </Permission>
        </div>
      </Fragment>
    );
  }
}

export default Summary;
