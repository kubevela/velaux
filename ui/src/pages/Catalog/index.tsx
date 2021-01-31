import React from 'react';
import { Button } from 'antd';
import ProList from '@ant-design/pro-list';
import request from 'umi-request';

type CatalogItem = {
  id: string;
  name: string;
  desc: string;
  created_at: string;
  updated_at: string;
  url: string;
};

export default () => (
  <ProList<CatalogItem>
    toolBarRender={() => {
      return [
        <Button key="3" type="primary">
          新建
        </Button>,
      ];
    }}
    search={{
      filterType: 'light',
    }}
    rowKey="name"
    headerTitle="基础列表"
    request={async (params = {}) =>
      request<{
        data: CatalogItem[];
      }>('/api/catalogs', {
        params,
      })
    }
    pagination={{
      pageSize: 5,
    }}
    showActions="hover"
    metas={{
      title: {
        dataIndex: 'name',
        title: '用户',
      },
      description: {
        dataIndex: 'desc',
        search: false,
      },
      actions: {
        render: (text, row) => [
          <a href={row.url} target="_blank" rel="noopener noreferrer" key="warning">
            信息
          </a>,
          <a href={row.url} target="_blank" rel="noopener noreferrer" key="view">
            打开
          </a>,
        ],
        search: false,
      },
      status: {
        // 自己扩展的字段，主要用于筛选，不在列表中显示
        title: '状态',
        valueType: 'select',
        valueEnum: {
          all: { text: '全部', status: 'Default' },
          open: {
            text: '未解决',
            status: 'Error',
          },
          closed: {
            text: '已解决',
            status: 'Success',
          },
          processing: {
            text: '解决中',
            status: 'Processing',
          },
        },
      },
    }}
  />
);
