import React from 'react';
import { Grid } from '@b-design/ui';

const { Col, Row } = Grid;
export type Props = {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  labelSpan?: number;
  marginBottom?: string;
};

const Item: React.FC<Props> = (props) => {
  return (
    <Row style={{ marginBottom: props.marginBottom || '16px' }}>
      <Col
        span={props.labelSpan ? props.labelSpan : 8}
        style={{
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '14px', color: '#a6a6a6' }}>{props.label}:</span>
      </Col>
      <Col
        span={props.labelSpan ? 24 - props.labelSpan : 16}
        style={{ fontSize: '14px', display: 'flex' }}
      >
        {props.value}
      </Col>
    </Row>
  );
};

export default Item;
