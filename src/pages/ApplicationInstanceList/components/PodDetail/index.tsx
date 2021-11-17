import React from 'react';
import { Grid } from '@b-design/ui';
import { PodBase } from '../../../../interface/observation';

const { Col, Row } = Grid;
export type Props = {
  pod: PodBase;
};

const PodDetail: React.FC<Props> = (props) => {
  return <Row>Pod Detail</Row>;
};

export default PodDetail;
