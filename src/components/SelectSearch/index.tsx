import React from 'react';
import { connect } from 'dva';
import { Button, Message, Grid, Search, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { dataSourceProject, dataSourceCluster, dataSourceApps } from '../../constants';
import './index.less';

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  clusterList?: [];
  namespaceList?: [];
};

type State = {
  namespaceValue: string;
  clusterValue: string;
  inputValue: string;
};

@connect((store: any) => {
  return { ...store.application, ...store.cluster };
})
class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      namespaceValue: '',
      clusterValue: '',
      inputValue: '',
    };
    this.handleChangeNamepace = this.handleChangeNamepace.bind(this);
    this.handleChangCluter = this.handleChangCluter.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
  }

  handleChangeNamepace(e: string) {
    console.log(e);
    this.setState(
      {
        namespaceValue: e,
      },
      () => {
        this.getApplication();
      },
    );
  }

  handleChangCluter(e: string) {
    console.log(e);
    this.setState(
      {
        clusterValue: e,
      },
      () => {
        this.getApplication();
      },
    );
  }

  handleChangName(e: string) {
    console.log(e);
    this.setState(
      {
        inputValue: e,
      },
      () => {
        this.getApplication();
      },
    );
  }

  getApplication = async () => {
    const { namespaceValue, clusterValue, inputValue } = this.state;
    const params = {
      namespace: namespaceValue,
      cluster: clusterValue,
      query: inputValue,
    };
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: params,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { t } = this.props;
    const projectPlacehole = t('Project Screening').toString();
    const clusterPlacehole = t('Cluster Screening').toString();
    const appPlacehole = t('Application name, description and search').toString();
    const { namespaceValue, clusterValue, inputValue } = this.state;
    const { clusterList, namespaceList } = this.props;

    return (
      <Row className="app-select-wraper boder-radius-8">
        <Col span="6">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangeNamepace}
            dataSource={namespaceList}
            placeholder={projectPlacehole}
            className="item"
            value={namespaceValue}
          />
        </Col>

        <Col span="6">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangCluter}
            dataSource={clusterList}
            placeholder={clusterPlacehole}
            className="item"
            value={clusterValue}
          />
        </Col>

        <Col span="6">
          <Input
            placeholder={appPlacehole}
            onChange={this.handleChangName}
            value={inputValue}
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
