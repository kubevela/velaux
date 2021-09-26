import React from 'react';
import { Button, Message, Grid, Dialog, Form, Input, } from '@b-design/ui';
import Translation from '../../components/translation';
import {
    pluginTitle,
    pluginSubTitle,
} from '../../constants/application';
import './index.less';

export default function () {
    const { Row, Col } = Grid;

    return (
        <div>
            <Row className='title-wraper'>
                <Col span='24'>
                    <span className='title'> {pluginTitle} </span>
                    <span className='subTitle'> {pluginSubTitle} </span>
                </Col>
            </Row>

        </div>
    )
}