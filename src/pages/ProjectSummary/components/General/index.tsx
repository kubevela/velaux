import React, { Component, Fragment } from 'react';
import { Button, Grid, Card } from '@b-design/ui';
import { Project, ProjectDetail } from '../../../../interface/project';
import { User } from '../../../../interface/user';
import Translation from '../../../../components/Translation';
import Item from '../../../../components/Item';
import { If } from 'tsx-control-statements/components';
import locale from '../../../../utils/locale';
import GeneralDialog from '../GeneralDialog';
import './index.less';

type Props = {
  projectDetails: ProjectDetail;
  userList: User[];
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
    } = this.props;
    const { isEditGeneral, editGeneral } = this.state;
    return (
      <Fragment>
        <div className="general-wrapper">
          <Card locale={locale.Card} contentHeight="auto" className="card-wrapper">
            <section className="card-title-wrapper">
              <span className="card-title">
                <Translation>General</Translation>
              </span>
              <Button
                className="card-button-wrapper"
                onClick={() => {
                  this.editGeneral(projectDetails);
                }}
              >
                <Translation>Edit</Translation>
              </Button>
            </section>
            <section className="card-content-wrapper">
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item label={<Translation>Name</Translation>} value={projectDetails.name} />
                </Col>
                <Col m={12} xs={24}>
                  <Item label={<Translation>Alias</Translation>} value={projectDetails.alias} />
                </Col>
              </Row>
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Owner</Translation>}
                    value={projectDetails.owner?.name}
                  />
                </Col>
              </Row>
              <Row wrap={true}>
                <Col span={24}>
                  <Item
                    label={<Translation>Description</Translation>}
                    labelSpan={4}
                    value={projectDetails.description}
                  />
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
