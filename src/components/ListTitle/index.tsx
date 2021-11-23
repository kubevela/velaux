import React from 'react';
import { Button, Grid } from '@b-design/ui';
import Translation from '../Translation';
import './index.less';
import { If } from 'tsx-control-statements/components';

type Props = {
  title: string;
  subTitle: string;
  extButtons?: [React.ReactNode];
  addButtonTitle?: string;
  addButtonClick?: () => void;
};
export default function (props: Props) {
  const { Row, Col } = Grid;
  const { title, subTitle, extButtons, addButtonTitle, addButtonClick } = props;

  return (
    <div>
      <Row className="title-wraper">
        <Col span="18">
          <span className="title font-size-20">
            <Translation>{title}</Translation>
          </span>
          <span className="subTitle font-size-14">
            <Translation>{subTitle}</Translation>{' '}
          </span>
        </Col>
        <Col span="6">
          <div className="float-right">
            {extButtons &&
              extButtons.map((item) => {
                return item;
              })}
            <If condition={addButtonTitle}>
              <Button type="primary" onClick={addButtonClick}>
                <Translation>{addButtonTitle ? addButtonTitle : ''}</Translation>
              </Button>
            </If>
          </div>
        </Col>
      </Row>
    </div>
  );
}
