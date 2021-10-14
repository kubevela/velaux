import React from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { managerTitle, managerSubTitle, addApp } from '../../constants';
import AppDialog from '../add-app-dialog/index';
import './index.less';

export default function () {
  const { Row, Col } = Grid;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Row className="title-wraper">
        <Col span="10">
          <span className="title font-size-20"> {managerTitle} </span>
          <span className="subTitle font-size-14"> {managerSubTitle} </span>
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
              {addApp}{' '}
            </Button>
          </div>
        </Col>
      </Row>

      <AppDialog visible={visible} setVisible={setVisible} />
    </div>
  );
}
