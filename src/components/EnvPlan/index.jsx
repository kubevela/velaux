import { Component } from 'react';
import { Input, Select, Icon, Form, Button, Dialog, Grid } from '@b-design/ui';
import _ from 'lodash';
import './index.less';

class EnvPlan extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: {
                [new Date().getTime()]: [{ name: '', cluster: '', description: '' }]
            },
        }
    }

    handleChangeName(key, index, val) {
        key.name = val;
        this.setState({});
    }

    handleSelectCluster(key, index, val) {
        key.cluster = val;
        this.setState({});
    }

    handleChangeDescription(key, index, val) {
        key.description = val;
        this.setState({});
    }

    // delete one
    handlleDeleteItem = (key, filterIndex) => {
        let { filters } = this.state;
        const queryKeys = Object.keys(filters);
        if (queryKeys.length === 1) {
            return Dialog.alert({
                title: 'Keep at least one',
                content: 'Keep at least one'
            });
        }
        const fields = _.get(filters, key, []);
        if (!fields || fields.length === 0) {
            return;
        }
        if (filters.length === 1) {
            filters = _.omit(filters, key);
        } else {
            fields.splice(filterIndex, 1);
            delete filters[key];
        }

        this.setState({
            filters: {
                ...filters
            }
        });
    }



    renderEnv() {
        const { Row, Col } = Grid;
        const { filters } = this.state;
        const { clusterList } = this.props;
        const result = [];

        const dataSource = (clusterList || []).map(item => ({ value: item.name, label: item.name }))

        console.log('filters', filters);
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                return;
            }

            filters[key].forEach((item, index) => {
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
        const { filters } = this.state;
        const obj = {};
        Object.keys(filters).map((item) => {
            filters[item] && filters[item].forEach((key) => {
                if (!key.name || !(key.name && key.name.trim()) || !key.description || !key.description) {
                    obj.key = {
                        name: key.name,
                        cluster: key.cluster,
                        description: key.description,
                    };
                }
            });
            return item;
        });


        for (const param in obj) {
            if (!obj[param].name || !obj[param].cluster || !obj[param].description) {
                return Dialog.alert({
                    title: 'must enter in conditional ',
                    content: 'You must complete the current item before you can add a new one'
                });
            }
        }

        this.setState({
            filters: {
                ...this.state.filters,
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