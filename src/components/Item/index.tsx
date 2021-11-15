import React from 'react';
import { Grid } from '@b-design/ui';

const { Col, Row } = Grid;
export type Props = {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
};

const Item: React.FC<Props> = (props) => {
  return (
    <Row style={{ marginBottom: '16px' }}>
      <Col span={8}>
        <span style={{ fontSize: '14px', color: '#a6a6a6' }}>{props.label}:</span>
      </Col>
      <Col span={16} style={{ fontSize: '14px' }}>
        {props.value}
      </Col>
    </Row>
  );
};

export default Item;
