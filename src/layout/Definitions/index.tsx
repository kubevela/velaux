import React, { Component } from 'react';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import { Grid } from '@b-design/ui';
import Title from '../../components/ListTitle';
import Menu from './components/Menu';
import Empty from '../../components/Empty';
import type { DefinitionMenuType } from '../../interface/definitions';
import { getMatchParamObj } from '../../utils/utils';
import './index.less';

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
        <Title
          title={'Definitions'}
          subTitle={
            'This is achieved by implementing its application model as programmable entities'
          }
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
