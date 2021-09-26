import React from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, } from '@b-design/ui';
import Translation from '../../components/translation';
import {
    managerTitle,
    managerSubTitle,
    addApp,
} from '../../constants/application';
import AppDialog from '../add-app-dialog/index';
import './index.less';

export default function () {
    const { Row, Col } = Grid;
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <Row className='title-wraper'>
                <Col span='10'>
                    <span className='title'> {managerTitle} </span>
                    <span className='subTitle'> {managerSubTitle} </span>
                </Col>
                <Col span='14'>
                    <div className='float-right'>
                        <Button type='primary' onClick={() => { setVisible(true) }}> {addApp} </Button>
                    </div>
                </Col>
            </Row>

            <AppDialog
                visible={visible}
                setVisible={setVisible}
            />
            
        </div>
    )
}