import React, { useState } from 'react';
import { Button, Message, Grid, Search, Icon, Select } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { addClust, clustGroup, clustTitle, clustSubTitle } from '../../../../constants';
import AddClustDialog from '../add-clust-dialog/index';
import './index.less';

export default function () {
  const { Row, Col } = Grid;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Row className="title-wraper">
        <Col span="10">
          <span className="title"> {clustTitle} </span>
          <span className="subTitle"> {clustSubTitle} </span>
        </Col>
        <Col span="14">
          <div className="float-right">
            <Button
              type="primary"
              onClick={() => {
                setVisible(true);
              }}
            >
              {' '}
              {addClust}{' '}
            </Button>
          </div>
        </Col>
      </Row>

      <AddClustDialog visible={visible} setVisible={setVisible} />
    </div>
  );
}
