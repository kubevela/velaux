import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Grid, Breadcrumb, Icon } from '@b-design/ui';
import { Link } from 'dva/router';
import Translation from '../../components/Translation';
import type { LoginUserInfo } from '../../interface/user';
import type { DefinitionMenuType } from '../../interface/definitions';
import _ from 'lodash';
import './index.less';
import classNames from 'classnames';

const { Row, Col } = Grid;

type Props = {
  activeId: string;
  match: {
    params: {
      definitionName: string;
      definitionType: string;
    };
  };
  dispatch: ({}) => {};
  userInfo?: LoginUserInfo;
  definitionTypes: DefinitionMenuType[];
};

@connect((store: any) => {
  return { ...store.definitions, ...store.user };
})
class DefinitionDetailsLayout extends Component<Props> {
  getNavList = () => {
    const { params = { definitionType: '', definitionName: '' } } = this.props.match;
    const { definitionType, definitionName } = params;
    const list = [
      {
        id: 'uiSchema',
        name: <Translation>UI Schema</Translation>,
        to: `/definitions/${definitionType}/${definitionName}/ui-schema`,
      },
    ];

    const nav = list.map((item) => {
      const active = this.props.activeId === item.id ? 'active' : '';
      return (
        <Link key={item.id} className={active} to={item.to}>
          {item.name}
        </Link>
      );
    });
    return nav;
  };

  matchDefinitionName = (definitionType: string) => {
    const { definitionTypes } = this.props;
    const matchDefinition = _.find(definitionTypes, (item) => {
      return item.type === definitionType;
    });
    return (matchDefinition && matchDefinition.name) || '';
  };

  render() {
    const menu = this.getNavList();
    const { params = { definitionType: '', definitionName: '' } } = this.props.match;
    const { definitionType, definitionName } = params;
    const matchDefinitionKey = this.matchDefinitionName(definitionType);

    return (
      <Fragment>
        <Row>
          <Col span={6} className={classNames('padding16', 'breadcrumb')}>
            <Link to={'/'}>
              <Icon type="home" />
            </Link>
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Translation>Definitions</Translation>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to={`/definitions/${definitionType}/config`}>{matchDefinitionKey}</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{definitionName}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <nav className="definitions-detail-wrapper">
          <ul>{menu}</ul>
        </nav>
        {this.props.children}
      </Fragment>
    );
  }
}

export default DefinitionDetailsLayout;
