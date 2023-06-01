import { Icon, Grid } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Component } from 'react';

import type { DefinitionMenuType } from '@velaux/data';
import './index.less';

type Props = {
  activeType: string;
  definitionTypes: DefinitionMenuType[];
};
type State = {};

class Menu extends Component<Props, State> {
  getMenuItem = () => {
    const { Row, Col } = Grid;
    const { activeType, definitionTypes } = this.props;
    const result = (definitionTypes || []).map((item) => {
      const isActive = activeType === item.type ? 'active-menu-item' : '';
      return (
        <li key={item.type}>
          <Link to={`/definitions/${item.type}/config`}>
            <Row className={`menu-item-wrapper ${isActive}`}>
              <Col span="22">
                <div className="menu-item-description">
                  <span className="padding-left-15"> {item.name}</span>
                </div>
              </Col>
              <Col span="2">
                <div className="menu-item-icon">
                  <Icon type="arrow-right" />
                </div>
              </Col>
            </Row>
          </Link>
        </li>
      );
    });
    return result;
  };

  render() {
    const menuItem = this.getMenuItem();
    return (
      <div className="definitions-menu-content">
        <ul>{menuItem}</ul>
      </div>
    );
  }
}

export default Menu;
