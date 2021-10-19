import React from 'react';
import { Button, Message, Grid, Search, Icon, Select } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { dataSourceProject, dataSourceCluster, dataSourceApps } from '../../constants';
import './index.less';

type Props = {
  t: (key: string) => {};
};

class SelectSearch extends React.Component<Props> {
  constructor(props: any) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e: string) {
    console.log(e);
  }

  render() {
    const { Row, Col } = Grid;
    const { t } = this.props;
    const projectPlacehole = t('Project Screening').toString();
    const clusterPlacehole = t('Cluster Screening').toString();
    const appPlacehole = t('Application name, description and search').toString();
    return (
      <Row className="select-wraper boder-radius-8">
        <Col span="6">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChange}
            dataSource={dataSourceProject}
            placeholder={projectPlacehole}
            className="item"
          />
        </Col>

        <Col span="6">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChange}
            dataSource={dataSourceCluster}
            placeholder={clusterPlacehole}
            className="item"
          />
        </Col>

        <Col span="6">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChange}
            dataSource={dataSourceApps}
            placeholder={appPlacehole}
            className="item"
          />
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
