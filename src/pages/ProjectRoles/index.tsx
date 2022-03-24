import React, { Component } from 'react';
import { Grid } from '@b-design/ui';
import ProjectMenu from './components/Menu';
import AuthList from './components/AuthList';
import './index.less';

class ProjectRoles extends Component {
  render() {
    const { Row, Col } = Grid;
    return (
      <Row className="project-roles-wrapper">
        <Col span="5">
          <ProjectMenu />
        </Col>
        <Col span="19">
          <AuthList />
        </Col>
      </Row>
    );
  }
}

export default ProjectRoles;
