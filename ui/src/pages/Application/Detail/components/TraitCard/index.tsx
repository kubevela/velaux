import React, { useState } from 'react';
import ProList from '@ant-design/pro-list';
import { ApiOutlined, ContainerTwoTone } from '@ant-design/icons';
import { ConfigProvider } from 'antd';

export interface TraitEntry extends API.TraitType {
    type: string;
    desc: string;
}

const customizeRenderEmpty = () => (
    <div style={{ textAlign: 'center' }}>
        <ContainerTwoTone style={{ fontSize: 40, margin: 10 }} />
        <p>
            No <a target="_blank" href="https://kubevela.io/docs/platform-engineers/overview#traits">Traite</a>
        </p>
    </div>
);

export default (props: any) => {
    const traits: TraitEntry[] = props.traits;
    return (
        <ConfigProvider renderEmpty={customizeRenderEmpty}>
            <ProList<{ type: string, desc: string }>
                rowKey="type"
                headerTitle="Traits"

                dataSource={traits}
                metas={{
                    title: {
                        dataIndex: 'type',
                    },
                    description: {
                        dataIndex: 'desc',
                    },
                    avatar: {
                        render: () => {
                            return (
                                <a><ApiOutlined /></a>
                            );
                        },
                    },
                }}
            >
            </ProList>
        </ConfigProvider>
    );
};
