import React, { Component } from 'react';
import { Input, Dialog, Icon, Dropdown, Menu } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import WorkFlowItem from '../workflow-item';

import { WorkFlowData } from '../entity';
import './index.less';



type Props = {
    dispatch: ({ }) => {},
    key: string,
    data: WorkFlowData
};

type State = {

};


class WorkFlowComponent extends Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {

        };

    }

    componentDidMount() { }


    setEditView = (appName: string, edit: boolean) => {
        this.props.dispatch({
            type: 'workflow/setEditView',
            payload: {
                appName,
                edit
            }
        })
    }

    deleteWorkflow = (appName: string) => {
        Dialog.confirm({
            content: `确定删除${appName}?`,
            onOk: () => {
                this.props.dispatch({
                    type: 'workflow/removeWorkflow',
                    payload: {
                        appName
                    }
                })
            }
        })

    }

    render() {
        const { data } = this.props;
        const menu = (
            <Menu>
                <Menu.Item>查看历史记录</Menu.Item>
                <Menu.Item>设置为默认</Menu.Item>
                <Menu.Item>禁用</Menu.Item>
                <Menu.Item onClick={() => this.deleteWorkflow(data.appName)}>删除</Menu.Item>
            </Menu>
        );
        return (
            <div className="workflow-component-container" id={data.appName}>
                <div className="workflow-component-title-container">
                    <div className="workflow-component-title-content">
                        <If condition={!data.option.edit}>
                            <div className="workflow-title">{data.name}</div>
                            <div className="workflow-description">{data.description}</div>
                        </If>
                        <If condition={data.option.edit}>
                            <div className="workflow-title">
                                <span className="input-container">名称: <Input className="input" defaultValue={data.name} /></span>
                            </div>
                            <div className="workflow-description">
                                <span className="input-container">描述: <Input className="input" defaultValue={data.description} /></span>
                            </div>
                        </If>
                    </div>
                    <div className="workflow-component-tips-container">
                        <If condition={!data.option.edit}>
                            <div className="option-item" onClick={() => { this.setEditView(data.appName, true) }}>
                                编辑
                            </div>
                        </If>
                        <If condition={data.option.edit}>
                            <div className="option-item" onClick={() => { this.setEditView(data.appName, false) }}>
                                保存
                            </div>
                        </If>
                        <div className="option-item">
                            <Dropdown trigger={<Icon type="ellipsis" className="options-icon" />} triggerType={["click"]} className="workflow-more">
                                {menu}
                            </Dropdown>
                        </div>

                    </div>
                </div>
                <div className="workflow-detail-container">
                    <WorkFlowItem data={data.data} workflowId={data.appName} edit={data.option.edit} />
                </div>
            </div>
        );
    }
}

export default WorkFlowComponent;
