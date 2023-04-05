import { Grid } from '@alifd/next';
import React from 'react';

const { Col, Row } = Grid;
export interface Props {
  title: string | React.ReactNode;
  actions: React.ReactNode[];
}

export const Title: React.FC<Props> = (props) => {
  return (
    <Row>
      <Col span={12}>
        <h3>{props.title}</h3>
      </Col>
      <Col span={12} className="flexright">
        <div style={{ padding: '12px 8px 0 0' }}>
          {props.actions.map((item) => {
            return item;
          })}
        </div>
      </Col>
    </Row>
  );
};
