import React, { MouseEvent } from 'react';
import './index.less';

import { Button, Message, Grid, Dialog, Form, Input, Card, Icon } from '@b-design/ui';
import { Cluster } from '../../../../interface/cluster';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clusters: [];
};

class CardContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }

  render() {
    const { Row, Col } = Grid;
    const { clusters } = this.props;
    return (
      <Row wrap={true}>
        {clusters.map((item: Cluster, index: number) => {
          const { name, alias, status, icon, description, createTime, dashboardURL = '' } = item;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <a href={dashboardURL}>
                <Card contentHeight="auto">
                  <If condition={icon}>
                    <img src={icon} alt="app-card" />
                  </If>
                  <div className="content-wraper background-F9F8FF">
                    <Row className="content-title">
                      <Col span="20" className="font-size-16 color1A1A1A">
                        {alias ? alias : name}
                      </Col>
                    </Row>
                    <Row className="content-main">
                      <h4 className="color595959 font-size-14">{description}</h4>
                    </Row>
                    <Row className="content-main-btn height-24"></Row>

                    <Row className="content-foot colorA6A6A6">
                      <Col span="16">
                        <span>{createTime}</span>
                      </Col>
                      <Col span="8" className="text-align-right padding-right-10">
                        {status}
                      </Col>
                    </Row>
                  </div>
                </Card>
              </a>
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default CardContent;
