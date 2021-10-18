import React from 'react';
import { Button, Message, Grid, Search, Icon, Select } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { clustGroup } from '../../../../constants';
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
    const clusterPlacehole = t('Cluster Screening').toString();
    return (
      <Row className="select-wraper">
        <Col span="18">
          <Select
            mode="single"
            size="large"
            onChange={this.handleChange}
            dataSource={clustGroup}
            placeholder={clusterPlacehole}
            className="item"
          />
        </Col>

        <Col span="6">
          <div className="btn-wrpaer">
            <Button type="primary" className="margin-right-20">
              {t('Determine')}
            </Button>
            <Button type="primary"> {t('Cancel')}</Button>
          </div>
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
