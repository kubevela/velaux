import React from 'react';
import { Button, Message, Grid, Search, Icon, Select, Step, Table } from '@b-design/ui';
import { workflowSet, execuResult } from '../../constants/application';


export default function () {
    console.log('workflowworkflowworkflowworkflow');
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

    const columns = [
        {
            key: 'status',
            title: '状态',
            dataIndex: 'status',
            cell: (v:string) => {
                return <span>{v}</span>
            },
        },
        {
            key: 'number',
            title: '编号',
            dataIndex: 'number',
            cell: (v:number) => {
                return <span>{v}</span>
            },
        },
    ];

    const { Column } = Table;
    return (
        <div style={{ background: "#fff", height: '100%' }}>
            <div>{workflowSet}</div>
            <Step current={1} shape="circle">
                {steps}
            </Step>
            <div style={{ height: '50px' }}>
                testtesttesttesttesttest
            </div>
            <div>
                <Table
                    dataSource={dataSource(10, 10)}
                    hasBorder={false}
                    primaryKey="requestId"
                    loading={false}
                >
                    {columns && columns.map((col, key) => <Column {...col} key={key} />)}
                </Table>
            </div>
        </div>
    );
}
