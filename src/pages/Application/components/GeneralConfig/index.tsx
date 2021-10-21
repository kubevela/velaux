import React, { createRef, LegacyRef } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select, Field, Radio } from '@b-design/ui';
import { dataSourceProject, dataSourceCluster, addApp, addAppDialog } from '../../constants';

type Props = {
    visible: boolean;
    namespaceList?: [];
    setVisible: (visible: boolean) => void;
    t: (key: string) => {};
    dispatch: ({ }) => {};
};

type State = {}

class GeneralConfig extends React.Component<Props, State> {
    field: any;
    constructor(props: any) {
        super(props);
        this.field = new Field(this);
        this.state = {}
    }
    close = () => {
        this.resetField();
    };
    submit = () => {
        console.log('this.dispatch', this.props.dispatch);
        this.field.validate((error: any, values: any) => {
            if (error) {
                return;
            }
            const { cluster, describe, name, project } = values;
            const params = {
                clusterList: cluster,
                description: describe,
                icon: '',
                name: name,
                namespace: '123', // test, hold on remove
            };
            this.props.dispatch({
                type: 'application/createApplicationList',
                payload: params,
            });
        });

        this.props.setVisible(false);
        this.resetField();
    };
    resetField() {
        this.field.setValues({
            name: '',
            project: '',
            cluster: [],
            describe: '',
        });
    }
    handleSelectProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('chose', e);
    };

    handleSelectCluster = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('chose', e);
    };

    render() {
        const { Row, Col } = Grid;
        const { visible, t } = this.props;
        const {
            name,
            project,
            clusterBind,
            describe,
            namePlaceHold,
            clustPlaceHold,
            describePlaceHold,
        } = addAppDialog;
        const FormItem = Form.Item;
        const formItemLayout = {
            labelCol: {
                fixedSpan: 6,
            },
            wrapperCol: {
                span: 18,
            },
        };

        const namePlacehold = t(namePlaceHold).toString();
        const clustPlacehold = t(clustPlaceHold).toString();
        const describePlacehold = t(describePlaceHold).toString();
        const init = this.field.init;
        return (
            <div>

                <Form {...formItemLayout} field={this.field}>
                    <FormItem {...formItemLayout} label={name} labelTextAlign="left" required={true}>
                        <Input htmlType="name" name="name" placeholder={namePlacehold} {...init('name')} />
                    </FormItem>
                    <FormItem {...formItemLayout} label={project} labelTextAlign="left" required={true}>
                        <Select
                            mode="single"
                            onChange={this.handleSelectProject}
                            {...init('project')}
                            dataSource={dataSourceProject}
                        />
                    </FormItem>
                    <FormItem {...formItemLayout} label={clusterBind} labelTextAlign="left" required={true}>
                        <Select
                            mode="tag"
                            onChange={this.handleSelectCluster}
                            dataSource={dataSourceCluster}
                            {...init('cluster')}
                            placeholder={clustPlacehold}
                            required={true}
                        />
                    </FormItem>

                    <FormItem {...formItemLayout} label={describe} labelTextAlign="left" required={true}>
                        <Input
                            htmlType="describe"
                            name="describe"
                            {...init('describe')}
                            placeholder={describePlacehold}
                        />
                    </FormItem>
                </Form>

            </div>
        );
    }
}

export default GeneralConfig;
