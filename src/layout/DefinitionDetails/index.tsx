import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Grid, Breadcrumb } from '@b-design/ui';
import { Link } from 'dva/router';
import Translation from '../../components/Translation';
import type { ProjectDetail } from '../../interface/project';
import type { LoginUserInfo } from '../../interface/user';
import './index.less';

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
  projectDetails?: ProjectDetail;
  location: any;
  userInfo?: LoginUserInfo;
};

@connect((store: any) => {
  return { ...store.project, ...store.user };
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

  render() {
    const menu = this.getNavList();
    const { params = { definitionType: '' } } = this.props.match;
    const { definitionType } = params;
    return (
      <Fragment>
        <Row>
          <Col span={6} className="padding16">
            <Breadcrumb separator="/">
              <Breadcrumb.Item>
                <Translation>Definitions</Translation>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to={`/definitions/${definitionType}/config`}>{definitionType}</Link>
              </Breadcrumb.Item>
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
