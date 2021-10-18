import React, { HtmlHTMLAttributes } from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input } from '@b-design/ui';
import Translation from '../Translation';
import { APPLICATION_PATH, CLUSTERS_PATH } from '../../utils/common';
import AppDialog from '../../pages/Application/components/add-app-dialog/index';
import AddClustDialog from '../../pages/Cluster/components/add-clust-dialog';
import './index.less';

type Props = {
  title: string;
  subTitle: string;
  btnName?: string;
  dialogName: string;
};
export default function (props: Props) {
  const { Row, Col } = Grid;
  const [visible, setVisible] = useState(false);
  const { title, subTitle, btnName, dialogName } = props;

  return (
    <div>
      <Row className="title-wraper">
        <Col span="18">
          <span className="title font-size-20">
            {' '}
            <Translation>{title}</Translation>
          </span>
          <span className="subTitle font-size-14">
            {' '}
            <Translation>{subTitle}</Translation>{' '}
          </span>
        </Col>
        {btnName && (
          <Col span="6">
            <div className="float-right">
              <Button
                type="primary"
                onClick={() => {
                  setVisible(true);
                }}
              >
                <Translation>{btnName}</Translation>
              </Button>
            </div>
          </Col>
        )}
      </Row>
      {dialogName === APPLICATION_PATH && <AppDialog visible={visible} setVisible={setVisible} />}
      {dialogName === CLUSTERS_PATH && <AddClustDialog visible={visible} setVisible={setVisible} />}
    </div>
  );
}
