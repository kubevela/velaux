import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, Select, Grid, Button, Card, Step } from '@b-design/ui';
import { dataSourceAppNames, managerTitle, managerName } from '../../constants/application';
import TabsContent from '../../components/tabs-content/index';
import "./index.less";
import { title } from 'process';

type Props = {
    match: {
        params: {
            name: string
        }
    },
    history: {
        push: (path: string, state: {}) => {}
    }
}

type State = {
    value: string
}
class General extends Component<Props, State>{
    constructor(props: any) {
        super(props);
        const { params } = this.props.match;
        this.state = {
            value: params.name
        }
    }
    componentDidMount() {
        console.log('componentDidMount')
    }
    handleSelect = (e: string) => {
        console.log('eee', e);
        console.log('this.propss', this.props);
        this.props.history.push('/application/SpringCloud2', {})
        this.setState({
            value: e
        })

    }

    render() {
        console.log('this.porps', this.props);
        const { value } = this.state;
        const { Row, Col } = Grid;
        const steps = [
            'step1',
            'step2',
            'step3',
            'step4',
            'step5',
        ].map((item, index) => <Step.Item key={index} title={item} />);
        const dataSource = (i: number, j: number) => {
            return [{
                status: '审核ing',
                number: 0
            },
            {
                status: '审核ing',
                number: 1
            }]
        };


        return (
            <div className='general'>
                <Row className='breadcrumb-wraper'>
                    <Col span='18'>
                        <Breadcrumb separator="/">
                            <Breadcrumb.Item link="javascript:void(0);">
                                <Link to={'/'}> {managerTitle} </Link>
                            </Breadcrumb.Item>
                            <Breadcrumb.Item link="javascript:void(0);">
                                {managerName}
                                <Select
                                    dataSource={dataSourceAppNames}
                                    value={value}
                                    onChange={this.handleSelect}
                                />
                            </Breadcrumb.Item>
                            <Breadcrumb.Item>总览</Breadcrumb.Item>
                        </Breadcrumb>
                    </Col>
                    <Col span='6'>
                        <div className='title-nav-button'>
                            <Button size='small' type='secondary'>发布为模型</Button>
                            <Button type='primary' className='margin-left-15'>部署/更新</Button>
                        </div>
                    </Col>
                </Row>
                <Row className='card-content-wraper'>
                    <Col span='12'>
                        <Card>
                            <div className='card-content'>
                                <div className='title'>
                                    {managerTitle}
                                </div>
                                <div className='deployment'>
                                    .已部署
                                </div>
                            </div>
                          <div className='padding-left-15'>  Policies:<Button> health</Button> </div>
                        </Card>
                    </Col>
                    <Col span='12'>
                        <div className='step-wraper'>
                            <div className='nav'>
                                <div className='title'> Workflow</div>
                                <div className='detail'> 查看详情</div>
                            </div>
                            <Step current={1} shape="circle">
                                {steps}
                            </Step>
                        </div>
                    </Col>
                </Row>
                <Row className='tabs-wraper'>
                    <TabsContent />
                </Row>
            </div>
        )
    }
}

export default General;