import { Grid } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';

import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import type { DefinitionMenuType } from '@velaux/data';
import { getMatchParamObj } from '../../utils/utils';

import Menu from './components/Menu';

import './index.less';
import { If } from '../../components/If';

type Props = {
  activeType: string;
  definitionTypes: DefinitionMenuType[];
  history: {
    push: (path: string, state?: {}) => {};
  };
  location: {
    pathname: string;
  };
  match: {
    params: {
      definitionType: string;
    };
    path: string;
  };
  dispatch: ({}) => {};
  children: any;
};

type State = {
  activeType: string;
  definitionTypes: DefinitionMenuType[];
};
@connect((store: any) => {
  return { ...store.definitions };
})
class DefinitionsLayout extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      activeType: this.getDefinitionType(),
      definitionTypes: props.definitionTypes,
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.location.pathname != this.props.location.pathname) {
      const nextPropsParams = nextProps.match.params || {};
      this.setState({
        activeType: nextPropsParams.definitionType,
      });
    }
  }

  getDefinitionType = () => {
    return getMatchParamObj(this.props.match, 'definitionType');
  };

  render() {
    const { Row, Col } = Grid;
    const { definitionTypes } = this.state;
    const { activeType } = this.state;
    return (
      <div className="definitions-wrapper">
        <ListTitle
          title={'Definitions'}
          subTitle={'This is achieved by implementing its application model as programmable entities'}
        />
        <If condition={!activeType}>
          <Empty style={{ marginTop: '40px' }} />
        </If>
        <If condition={activeType}>
          <Row>
            <Col span="5">
              <Menu activeType={activeType} definitionTypes={definitionTypes} />
            </Col>
            <Col span="19">{this.props.children}</Col>
          </Row>
        </If>
      </div>
    );
  }
}

export default DefinitionsLayout;
