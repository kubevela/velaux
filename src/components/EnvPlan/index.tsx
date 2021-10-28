import React, { Component } from 'react';
import { Input, Select, Icon, Form, Button, Grid, Message } from '@b-design/ui';
import _ from 'lodash';
import './index.less';

type Props = {
    clusterList?: [];
}
type State = {
    envs: {
        [key: string]: [EnvItem]
    }
}
type EnvItem = {
    name: string;
    cluster: string;
    description?: string
}

class EnvPlan extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            envs: {
                [new Date().getTime()]: [{ name: '', cluster: '', description: '' }]
            },
        }
    }

    handleChangeName(key: EnvItem, index: number, val: string) {
        key.name = val;
        this.setState({});
    }

    handleSelectCluster(key: EnvItem, index: number, val: string) {
        key.cluster = val;
        this.setState({});
    }

    handleChangeDescription(key: EnvItem, index: number, val: string) {
        key.description = val;
        this.setState({});
    }

    // delete one
    handlleDeleteItem = (key: string, filterIndex: number) => {
        let { envs } = this.state;
        const queryKeys = Object.keys(envs);
        if (queryKeys.length === 1) {
            return Message.show({
                type: 'warning',
                title: 'Warning',
                content: ' Keep at least one',
            });
        }
        const fields = _.get(envs, key, []);
        if (!fields || fields.length === 0) {
            return;
        }

        fields.splice(filterIndex, 1);
        delete envs[key];

        this.setState({
            envs: {
                ...envs
            }
        });
    }



    renderEnv() {
        const { Row, Col } = Grid;
        const { envs } = this.state;
        const { clusterList } = this.props;
        const result: any = [];
        const dataSource = (clusterList || []).map((item: { name: string }) => ({ value: item.name, label: item.name }));

        Object.keys(envs).forEach(key => {
            if (!envs[key]) {
                return;
            }

            envs[key].forEach((item, index) => {
                result.push(
                    <Row className="env-bind margin-bottom-10" key={key}>
                        <Col span='8'>
                            <Input
                                required
                                className="input-name"
                                value={item.name}
                                onChange={val => this.handleChangeName(item, index, val)}
                            />
                        </Col>

                        <Col span='8'>
                            <Select
                                className="slect-cluster"
                                value={item.cluster}
                                dataSource={dataSource}
                                onChange={val => this.handleSelectCluster(item, index, val)}
                            />
                        </Col>

                        <Col span='8' className="item_span_15">
                            <Input
                                className="input-description"
                                value={item.description}
                                onChange={val => this.handleChangeDescription(item, index, val)}
                            />

                            <span
                                className="margin-left-4"
                                onClick={() => {
                                    this.handlleDeleteItem(key, index);
                                }}
                            >
                                <Icon type="minus-circle" size="medium" />
                            </span>

                        </Col>

                    </Row >
                );
            });
        });

        return <div>{result}</div>
    }

    // add item
    handlleAddItem = () => {
        const { envs } = this.state;
        const obj: any = {};
        Object.keys(envs).map((item) => {
            envs[item] && envs[item].forEach((key: EnvItem) => {
                if (!key.name || !(key.name && key.name.trim()) || !key.cluster || !(key.cluster && key.cluster.trim())) {
                    obj.key = {
                        name: key.name,
                        cluster: key.cluster,
                    };
                }
            });
            return item;
        });

        for (const param in obj) {
            if (!obj[param].name || !obj[param].cluster) {
                return Message.show({
                    type: 'warning',
                    title: 'Warning',
                    content: 'name and cluster  is must enter',
                });
            }
        }


        this.setState({
            envs: {
                ...this.state.envs,
                [Date.now()]: [{ name: '', cluster: '', description: '' }]
            }
        });
    }

    render() {
        const { Row, Col } = Grid;
        return (
            <div className='env-bind-wraper'>
                <Row>
                    <Col span='8' className='text-align-center'>name </Col>
                    <Col span='8' className='text-align-center'> clusterSelector </Col>
                    <Col span='8' className='text-align-center'>
                        <div >
                            <span className='add-description'>description</span>
                            <span
                                className="margin-left-4"
                                onClick={() => {
                                    this.handlleAddItem();
                                }}
                            >
                                <Icon type="plus-circle" size="medium" />
                            </span>
                        </div>
                    </Col>
                </Row>
                {this.renderEnv()}
            </div>

        )
    }
}

export default EnvPlan;