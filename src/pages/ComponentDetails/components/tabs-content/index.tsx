import React, { useState, Component } from 'react';
import PropTypes from 'prop-types';

import { Button, Message, Grid, Search, Icon, Select, Tab } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import BasicInfo from '../basic-info';
import './index.less';

class TabsContent extends Component {
  handleChange = () => {};
  render() {
    return (
      <div>
        <div className="tabs-content">
          <Tab shape="wrapped" size="small" onChange={this.handleChange}>
            <Tab.Item title={<Translation>Base information</Translation>}>
              <BasicInfo />
            </Tab.Item>
            <Tab.Item title={<Translation>Running instances</Translation>}>运行实例</Tab.Item>
            <Tab.Item title={<Translation>Log query</Translation>}>日志查询</Tab.Item>
            <Tab.Item title={<Translation>Surveillance panel</Translation>}>监控面板</Tab.Item>
          </Tab>
        </div>
      </div>
    );
  }
}

export default TabsContent;
