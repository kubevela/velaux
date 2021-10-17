import React, { Component } from 'react';
import { Grid } from '@b-design/ui';
import {
  COMPONENT_PARAMETER_CONFIGURATION,
  DATA_INPUT,
  DATA_OUTPUT,
  OPERATING_CHARACTERISTICS,
} from '../../constants';

class BasicInfo extends Component {
  render() {
    const { Row, Col } = Grid;
    return (
      <div>
        <h3 className="padding-left-15">{COMPONENT_PARAMETER_CONFIGURATION}</h3>
        <section className="height150 background-FFFFFF"></section>

        <Row>
          <Col span="12">
            <h3 className="padding-left-15">{DATA_INPUT}</h3>
            <div className="height150 background-FFFFFF margin-right-10"></div>
          </Col>
          <Col span="12">
            <h3 className="padding-left-15">{DATA_OUTPUT}</h3>
            <div className="height150 background-FFFFFF"></div>
          </Col>
        </Row>
        <h3 className="padding-left-15">{OPERATING_CHARACTERISTICS}</h3>
        <section className="height150 background-FFFFFF"></section>
      </div>
    );
  }
}

export default BasicInfo;
