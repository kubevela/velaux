import { Button, Grid, Card, Message } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { Project, ProjectDetail , User } from '@velaux/data';
import { momentDate } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
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
    const { Row, Col } = Grid;
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
        <div className="general-wrapper">
          <Card locale={locale().Card} contentHeight="auto" className="card-wrapper">
            <section className="card-title-wrapper">
              <span className="card-title">
                <Translation>General</Translation>
              </span>
              <Permission request={{ resource: `project:${projectName}`, action: 'update' }} project={projectName}>
                <Button
                  className="card-button-wrapper"
                  onClick={() => {
                    this.editGeneral(projectDetails);
                  }}
                >
                  <Translation>Edit</Translation>
                </Button>
              </Permission>
            </section>
            <section className="card-content-wrapper">
              <If condition={projectDetails.description}>
                <Row style={{ marginBottom: '16px' }}>
                  <Message type="notice">{projectDetails.description}</Message>
                </Row>
              </If>
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Name(Alias)</Translation>}
                    value={`${projectDetails.name}(${projectDetails.alias || '-'})`}
                  />
                </Col>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Owner</Translation>}
                    value={
                      projectDetails.owner?.alias
                        ? `${projectDetails.owner?.alias}(${projectDetails.owner?.name})`
                        : projectDetails.owner?.name
                    }
                  />
                </Col>
              </Row>
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item label={<Translation>Create Time</Translation>} value={momentDate(projectDetails.createTime)} />
                </Col>
                <Col m={12} xs={24}>
                  <Item label={<Translation>Update Time</Translation>} value={momentDate(projectDetails.updateTime)} />
                </Col>
              </Row>
            </section>
          </Card>
        </div>

        <If condition={isEditGeneral}>
          <GeneralDialog
            isEditGeneral={isEditGeneral}
            editGeneral={editGeneral}
            userList={userList}
            onUpdateGeneral={this.onUpdateGeneral}
            onCloseGeneral={this.onCloseGeneral}
          />
        </If>
      </Fragment>
    );
  }
}

export default General;
