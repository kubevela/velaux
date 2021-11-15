import React from 'react';
import { Grid } from '@b-design/ui';

const { Col, Row } = Grid;
export type Props = {
  title: string | React.ReactNode;
  actions: React.ReactNode[];
};

const Title: React.FC<Props> = (props) => {
  return (
    <Row>
      <Col span={12}>
        <h3>{props.title}</h3>
      </Col>
      <Col span={12} className="flexright">
        <div>
          {props.actions.map((item) => {
            return item;
          })}
        </div>
      </Col>
    </Row>
  );
};

export default Title;
