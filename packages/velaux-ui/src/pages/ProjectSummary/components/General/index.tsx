import { Button } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import Permission from '../../../../components/Permission';
import { RelativeTime } from '../../../../components/RelativeTime';
import { Translation } from '../../../../components/Translation';
import type { Project, ProjectDetail, User } from '@velaux/data';
import GeneralDialog from '../GeneralDialog';
import './index.less';

type Props = {
  projectDetails: ProjectDetail;
  userList: User[];
  projectName: string;
  loadProjectDetail: () => void;
};

type State = {
  editGeneral: Project;
  isEditGeneral: boolean;
};
class General extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      editGeneral: { name: '', alias: '', owner: { name: '', alias: '' }, description: '' },
      isEditGeneral: false,
    };
  }

  editGeneral = (item: Project) => {
    this.setState({
      editGeneral: item,
      isEditGeneral: true,
    });
  };

  onCloseGeneral = () => {
    this.setState({
      isEditGeneral: false,
    });
  };

  onUpdateGeneral = () => {
    this.setState({
      isEditGeneral: false,
    });
    this.props.loadProjectDetail();
  };

  render() {
    const {
      userList,
      projectDetails = {
        name: '',
        alias: '',
        createTime: '',
        description: '',
        owner: { name: '', alias: '' },
      },
      projectName,
    } = this.props;
    const { isEditGeneral, editGeneral } = this.state;
    return (
      <Fragment>
        <div className="project-about">
          <div className="project-about-head">
            <span className="summary-section-title">
              <Translation>About</Translation>
            </span>
            <Permission request={{ resource: `project:${projectName}`, action: 'update' }} project={projectName}>
              <Button
                onClick={() => {
                  this.editGeneral(projectDetails);
                }}
              >
                <Translation>Edit</Translation>
              </Button>
            </Permission>
          </div>
          <p className={`project-about-description ${projectDetails.description ? '' : 'empty'}`}>
            {projectDetails.description || <Translation>No description</Translation>}
          </p>
          <div className="project-about-facts">
            <div>
              <span>
                <Translation>Name</Translation>
              </span>
              <span>{projectDetails.name}</span>
            </div>
            <div>
              <span>
                <Translation>Owner</Translation>
              </span>
              <span>{projectDetails.owner?.alias || projectDetails.owner?.name || '-'}</span>
            </div>
            <div>
              <span>
                <Translation>Created</Translation>
              </span>
              <RelativeTime time={projectDetails.createTime} />
            </div>
            <div>
              <span>
                <Translation>Updated</Translation>
              </span>
              <RelativeTime time={projectDetails.updateTime} />
            </div>
          </div>
        </div>

        {isEditGeneral && (
          <GeneralDialog
            isEditGeneral={isEditGeneral}
            editGeneral={editGeneral}
            userList={userList}
            onUpdateGeneral={this.onUpdateGeneral}
            onCloseGeneral={this.onCloseGeneral}
          />
        )}
      </Fragment>
    );
  }
}

export default General;
