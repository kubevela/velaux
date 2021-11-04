import React, { Component } from 'react';

import { Grid, Tab } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import {
  LOG_QUERY,
  SURVEILLANCE_PANEL,
  ENV_DISTRUIBUTION,
  RUNNING_INSTANCES,
} from '../../constants';
import BasicInfo from '../basic-info';
import './index.less';

type Props = {
  dispatch: ({}) => {};
};
class TabsContent extends Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  handleChange = (key: string | number) => {};

  render() {
    const { Row, Col } = Grid;
    const { dispatch } = this.props;
    return (
      <Row className="detail-tabs-wraper margin-top-20">
        <div className="tabs-content">
          <Tab shape="wrapped" size="small" onChange={this.handleChange}>
            <Tab.Item title={<Translation>Overview</Translation>}>
              <BasicInfo dispatch={dispatch} />
            </Tab.Item>
            <Tab.Item title={RUNNING_INSTANCES}>运行实例</Tab.Item>
            <Tab.Item title={LOG_QUERY}>日志查询</Tab.Item>
            <Tab.Item title={SURVEILLANCE_PANEL}>监控面板</Tab.Item>
          </Tab>
        </div>
      </Row>
    );
  }
}

export default TabsContent;
