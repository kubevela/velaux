import { Grid, Card, Breadcrumb, Button } from '@b-design/ui';
import { connect } from 'dva';
import React, { Component } from 'react';
import Translation from '../../../../components/Translation';
const { Row, Col } = Grid;

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationHeader extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {}

  render() {
    const { applicationDetail } = this.props;
    const item = <Translation>Application Basic</Translation>;
    return (
      <div>
        <Row>
          <Col span={6} className="padding16">
            <Breadcrumb>
              <Breadcrumb.Item link="/applications">
                <Translation>Application Manager</Translation>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{applicationDetail.alias || applicationDetail.name}</Breadcrumb.Item>
              <Breadcrumb.Item>{item}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          <Col span={18} className="flexright padding16">
            <Button type="primary">
              <Translation>Deploy</Translation>
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={4} className="padding16">
            <Card>todo:status</Card>
          </Col>
          <Col span={20} className="padding16">
            <Card>todo:workflow-status</Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ApplicationHeader;
