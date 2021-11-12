import React from 'react';
import { connect } from 'dva';
import { Button, Message, Grid, Search, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import './index.less';
import Translation from '../../../../components/Translation';

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
    this.setState(
      {
        namespaceValue: e,
      },
      () => {
        this.getApplicationPlans();
      },
    );
  }

  handleChangCluter(e: string) {
    this.setState(
      {
        clusterValue: e,
      },
      () => {
        this.getApplicationPlans();
      },
    );
  }

  handleChangName(e: string) {
    this.setState({
      inputValue: e,
    });
  }

  handleClickSearch = () => {
    this.getApplicationPlans();
  };

  getApplicationPlans = async () => {
    const { namespaceValue, clusterValue, inputValue } = this.state;
    const params = {
      namespace: namespaceValue,
      cluster: clusterValue,
      query: inputValue,
    };
    this.props.dispatch({
      type: 'application/getApplicationPlanList',
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
    const clusterDadasource = (clusterList || []).map((item: { name: string }) => ({
      value: item.name,
      label: item.name,
    }));
    return (
      <Row className="app-select-wraper boder-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangeNamepace}
            dataSource={namespaceList}
            placeholder={projectPlacehole}
            className="item"
            hasClear
            value={namespaceValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            mode="single"
            size="large"
            onChange={this.handleChangCluter}
            dataSource={clusterDadasource}
            placeholder={clusterPlacehole}
            className="item"
            hasClear
            value={clusterValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Input
            innerAfter={
              <Icon
                type="search"
                size="xs"
                onClick={this.handleClickSearch}
                style={{ margin: 4 }}
              />
            }
            hasClear
            placeholder={appPlacehole}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            className="item"
          />
        </Col>
        <Col span="3" style={{ paddingTop: '20px' }}>
          <Button
            type="secondary"
            onClick={() => {
              this.setState(
                {
                  namespaceValue: '',
                  clusterValue: '',
                  inputValue: '',
                },
                () => {
                  this.handleClickSearch();
                },
              );
            }}
          >
            <Translation>Clear</Translation>
          </Button>
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
