import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import type { Project } from '../../interface/project';
import type { User } from '../../interface/user';
import { getUserList } from '../../api/users';
import General from './components/General';
import Targets from './components/Targets';
import Integrations from './components/Integrations';

type Props = {
  projectDetails: Project;
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

  componentDidMount() {
    this.listUser();
  }

  listUser = async () => {
    const param = {
      name: '',
    };
    getUserList(param).then((res) => {
      if (res && res.users) {
        const userListData = (res.users || []).map((item: User) => ({
          label: item.name,
          value: item.name,
        }));
        this.setState({
          userList: userListData || [],
        });
      }
    });
  };

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
        <General
          projectDetails={projectDetails}
          userList={userList}
          loadProjectDetail={this.loadProjectDetail}
        />
        <Targets projectName={params.projectName} />
        <Integrations />
      </Fragment>
    );
  }
}

export default Summary;
