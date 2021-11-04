import React, { Component } from 'react';
import { Grid, Card, Button } from '@b-design/ui';
import {
  BASIC_INFOMATION,
  DEPLOYMENT_STATUS,
  ENV_DISTRUIBUTION,
  UPDATE_TIME,
  CREATION_TIME,
  OWNING_APPLICATION,
  DEPLOYMENT_VERSION,
  EDIT_CONFIGURATION,
  NEW_FEATURES,
} from '../../constants';
import EditBasicDialog from '../EditBasicDialog';
import './index.less';

type Props = {
  dispatch: ({}) => {};
};

type State = {
  visible: boolean;
};
class BasicInfo extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  onOK = () => {
    this.setState({
      visible: false,
    });
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { visible } = this.state;
    const { dispatch } = this.props;
    return (
      <div className="basic-info-wraper">
        <Row>
          <Col span="18">
            {' '}
            <h3 className="padding-left-15">{BASIC_INFOMATION}</h3>
          </Col>
          <Col span="6">
            <Button
              className="edit-config"
              component="a"
              text
              onClick={() => {
                this.setState({ visible: true });
              }}
            >
              {EDIT_CONFIGURATION}
            </Button>
          </Col>
        </Row>

        <Card>
          <Row>
            <Col span="8">
              <p className="padding-left-15">
                <span> {DEPLOYMENT_STATUS}:</span>
                <span> 已部署(健康) </span>
              </p>
              <p className="padding-left-15">
                <span> {OWNING_APPLICATION}: </span>
                <span> 智慧工厂应用 </span>
              </p>
            </Col>
            <Col span="8">
              <p className="padding-left-15">
                <span> {ENV_DISTRUIBUTION}:</span>
                <span> 开发环境</span>
              </p>
              <p className="padding-left-15">
                <span> {DEPLOYMENT_VERSION}: </span>
                <span> 321312313131 </span>
              </p>
            </Col>

            <Col span="8">
              <p className="padding-left-15">
                <span> {UPDATE_TIME}: </span>
                <span> 2021-10-26 19:08:00</span>
              </p>
              <p className="padding-left-15">
                <span> {CREATION_TIME}: </span>
                <span> 2021-10-26 19:08:00</span>
              </p>
            </Col>
          </Row>
        </Card>

        <EditBasicDialog
          visible={visible}
          onOK={this.onOK}
          onClose={this.onClose}
          dispatch={dispatch}
        />
      </div>
    );
  }
}

export default BasicInfo;
