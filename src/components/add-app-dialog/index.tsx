import React from 'react';
import { useState } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select } from '@b-design/ui';
import Translation from '../../components/translation';
import {

    dataSourceProject,
    dataSourceCluster,
    addApp,
    addAppDialog,
} from '../../constants/application';
import './index.less';

type Props = {
    visible: boolean;
    setVisible: (visible: boolean) => void;
};

type State = {

};

class AppDialog extends React.Component<Props, State>{
    onClose = () => {
        this.props.setVisible(false);
    }
    onOk = () => {
        this.props.setVisible(false);
    }

    handleSelectProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('chose', e);
    }

    handleSelectCluster = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('chose', e);
    }

    render() {
        const { Row, Col } = Grid;
        const { visible } = this.props;
        const { name, project, clusterBind, describe, namePlaceHold, clustPlaceHold, describePlaceHold } = addAppDialog;
        const FormItem = Form.Item
        const formItemLayout = {
            labelCol: {
                fixedSpan: 4,
            },
            wrapperCol: {
                span: 20,
            },
        };

        return (
            <div>
                <Dialog
                    className='dialog-app-wraper'
                    title={addApp}
                    visible={visible}
                    footerActions={['ok']}
                    onOk={this.onOk}
                    onCancel={this.onClose}
                    onClose={this.onClose}>
                    <Form {...formItemLayout}>
                        <FormItem label={name}>
                            <Input
                                htmlType="name"
                                name="name"
                                placeholder={namePlaceHold}
                            />
                        </FormItem>
                        <FormItem label={project}>
                            <Select
                                mode="single"
                                onChange={this.handleSelectProject}
                                dataSource={dataSourceProject}
                            />
                        </FormItem>
                        <FormItem label={clusterBind}>
                            <Select
                                mode="tag"
                                onChange={this.handleSelectCluster}
                                dataSource={dataSourceCluster}
                                placeholder={clustPlaceHold}
                            />
                        </FormItem>

                        <FormItem label={describe}>
                            <Input
                                htmlType="describe"
                                name="describe"
                                placeholder={describePlaceHold}
                            />
                        </FormItem>
                    </Form>
                </Dialog>
            </div>
        )
    }
}

export default AppDialog;