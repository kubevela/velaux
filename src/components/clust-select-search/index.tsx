import React from 'react';
import { Button, Message, Grid, Search, Icon, Select } from '@b-design/ui';
import Translation from '../translation';
import {
    clustGroup
} from '../../constants/application';
import './index.less';


class SelectSearch extends React.Component {
    constructor(props: any) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e: string) {
        console.log(e);
    }

    render() {
        const { Row, Col } = Grid;
        return (
            <Row className='select-wraper'>
                <Col span='18'>
                    <Select
                        mode="single"
                        size='large'
                        onChange={this.handleChange}
                        dataSource={clustGroup}
                        defaultValue={'集群筛选'}
                        className='item'
                    />
                </Col>

                <Col span='6'>
                    <div className='btn-wrpaer'>
                        <Button type='primary' className='margin-right-20'> 确定</Button>
                        <Button type='primary'> 重置</Button>
                    </div>

                </Col>
            </Row>
        )
    }
}

export default SelectSearch;