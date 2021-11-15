import React, { Component } from 'react';
import { Grid, Button, Card, Message, Progress } from '@b-design/ui';
import './index.less';
import { connect } from 'dva';
import Translation from '../../components/Translation';
import Title from '../../components/Title';
import Item from '../../components/Item';
import { ApplicationDetail } from '../../interface/application';
import { momentDate } from '../../utils/common';

const { Row, Col } = Grid;

type Props = {
  match: {
    params: {
      appName: string;
      componentName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
  applicationDetail?: ApplicationDetail;
};

type State = {
  appName: string;
  componentName: string;
};
@connect((store: any) => {
  return { ...store.application };
})
class ApplicationConfig extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      appName: params.appName,
      componentName: params.componentName,
    };
  }
  componentDidMount() {}

  render() {
    const { applicationDetail } = this.props;
    return (
      <div>
        <Row>
          <Col span={12} className="padding16">
            <Message
              type="notice"
              title="Note that benchmark configuration changes will be applied to all environments"
            ></Message>
          </Col>
          <Col span={12} className="padding16 flexright">
            <Button type="secondary">
              <Translation>Edit Parameter</Translation>
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={12} className="padding16">
            <Card>
              <Row>
                <Col span={12}>
                  <Item label="alias" value={applicationDetail && applicationDetail.alias}></Item>
                </Col>
                <Col span={12}>
                  <Item
                    label="project"
                    value={applicationDetail && applicationDetail.namespace}
                  ></Item>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Item
                    label="createTime"
                    value={momentDate(applicationDetail && applicationDetail.createTime)}
                  ></Item>
                </Col>
                <Col span={12}>
                  <Item
                    label="updateTime"
                    value={momentDate(applicationDetail && applicationDetail.updateTime)}
                  ></Item>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Item
                    label="description"
                    value={applicationDetail && applicationDetail.description}
                  ></Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12} className="padding16">
            <Card></Card>
          </Col>
        </Row>

        <Row>
          <Col span={24} className="padding16">
            <Title
              actions={[
                <a>
                  <Translation>Add Trait</Translation>
                </a>,
              ]}
              title={<Translation>Traits</Translation>}
            ></Title>
          </Col>
        </Row>
        <Row>
          <Col span={8} className="padding16">
            <Card></Card>
          </Col>
          <Col span={8} className="padding16">
            <Card></Card>
          </Col>
          <Col span={8} className="padding16">
            <Card></Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ApplicationConfig;
