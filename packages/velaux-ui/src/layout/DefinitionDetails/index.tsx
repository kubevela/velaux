import { Grid } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import { AiOutlineCode, AiOutlineLayout, AiOutlineRead } from 'react-icons/ai';
import React, { Component, Fragment } from 'react';

import { Translation } from '../../components/Translation';
import { Breadcrumb } from '../../components/Breadcrumb';
import { definitionPlaceFrom, definitionPlaceQuery } from '../../utils/definitionPlace';
import type { DefinitionMenuType, LoginUserInfo } from '@velaux/data';

import './index.less';
import classNames from 'classnames';

const { Row, Col } = Grid;

type Props = {
  activeId: string;
  location: { search: string };
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
    const query = definitionPlaceQuery(definitionPlaceFrom(this.props.location.search));
    const list = [
      {
        id: 'doc',
        icon: <AiOutlineRead />,
        name: <Translation>Documentation</Translation>,
        to: `/definitions/${definitionType}/${definitionName}/doc${query}`,
      },
      {
        id: 'file',
        icon: <AiOutlineCode />,
        name: <Translation>CUE Source</Translation>,
        to: `/definitions/${definitionType}/${definitionName}/file${query}`,
      },
      {
        id: 'uiSchema',
        icon: <AiOutlineLayout />,
        name: <Translation>UI Schema</Translation>,
        to: `/definitions/${definitionType}/${definitionName}/ui-schema${query}`,
      },
    ];

    const nav = list.map((item) => {
      const active = this.props.activeId === item.id ? 'active' : '';
      return (
        <Link key={item.id} className={classNames('definition-tab', active)} to={item.to} role="tab">
          {item.icon}
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

    return (
      <Fragment>
        <Row>
          <Col span={6} className={classNames('padding16', 'breadcrumb')}>
            <Breadcrumb
              items={[
                {
                  to: `/definitions/${definitionType}/config`,
                  title: 'Definitions',
                },
                {
                  title: definitionName,
                },
              ]}
            />
          </Col>
        </Row>
        <nav className="definition-tabs" role="tablist">
          {menu}
        </nav>
        {this.props.children}
      </Fragment>
    );
  }
}

export default DefinitionDetailsLayout;
