import React, { Component } from 'react';
import { Link } from 'dva/router';
import { Button, Message, Grid, Search, Icon, Select, Step, Table, Breadcrumb } from '@b-design/ui';
import {
  workflowSet,
  execuResult,
  dataSourceAppNames,
  MANAGER_TITLE,
  MANAGER_NAME,
} from './constants';

import './index.less';

type Props = {
  match: {
    params: {
      name: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
};

type State = {
  value: string;
  visible: boolean;
};

class Workflow extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      value: params.name,
      visible: false,
    };
  }

  componentDidMount() {
    console.log('componentDidMount', window.screen.height);
  }
  handleSelect = (e: string) => {
    console.log('eee', e);
    console.log('this.propss', this.props);
    this.props.history.push(`/workflow/${e}`, {});
    this.setState({
      value: e,
    });
  };

  render() {
    const { value, visible } = this.state;
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'].map((item, index) => (
      <Step.Item key={index} title={item} />
    ));
    const dataSource = (i: number, j: number) => {
      return [
        {
          status: '审核ing',
          number: 0,
          type: '触发类型',
          person: '触发人',
          date: '2021-01-01',
        },
        {
          status: '审核ing',
          number: 1,
          type: '触发类型',
          person: '触发人',
          date: '2021-01-01',
        },
        {
          status: '审核ing',
          number: 2,
          type: '触发类型',
          person: '触发人',
          date: '2021-01-01',
        },
        {
          status: '审核ing',
          number: 3,
          type: '触发类型',
          person: '触发人',
          date: '2021-01-01',
        },
      ];
    };

    const columns = [
      {
        key: 'status',
        title: '状态',
        dataIndex: 'status',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'number',
        title: '编号',
        dataIndex: 'number',
        cell: (v: number) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'type',
        title: '触发类型',
        dataIndex: 'type',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'person',
        title: '触发人',
        dataIndex: 'person',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'date',
        title: '开始时间',
        dataIndex: 'date',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
    ];

    const { Column } = Table;
    const { Row, Col } = Grid;
    return (
      <div style={{ height: '100%' }} className="workflow-wraper">
        <Row className="breadcrumb-wraper">
          <Col span="17">
            <Breadcrumb separator="/">
              <Breadcrumb.Item link="javascript:void(0);">
                <Link to={'/'}> {MANAGER_TITLE} </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item link="javascript:void(0);">
                {MANAGER_NAME}
                <Select
                  dataSource={dataSourceAppNames}
                  value={value}
                  onChange={this.handleSelect}
                />
              </Breadcrumb.Item>
              <Breadcrumb.Item>{'workflow设置'}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        <h2>{workflowSet}</h2>
        <Step current={1} shape="circle">
          {steps}
        </Step>
        <h3 style={{ height: '120px', background: '#fff', padding: '15px' }}>配置参数</h3>
        <h2>执行记录</h2>
        <div>
          <Table
            dataSource={dataSource(10, 10)}
            hasBorder={false}
            primaryKey="requestId"
            loading={false}
          >
            {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
          </Table>
        </div>
      </div>
    );
  }
}

export default Workflow;
