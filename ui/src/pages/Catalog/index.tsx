import React from 'react';
import { Button } from 'antd';
import ProList from '@ant-design/pro-list';
import request from 'umi-request';

type CatalogItem = {
  id: string;
  name: string;
  desc: string;
  url: string;
};

export default () => (
  <ProList<CatalogItem>
    toolBarRender={() => {
      return [
        <Button key="3" type="primary">
          Add
        </Button>,
      ];
    }}
    search={{
      filterType: 'light',
    }}
    rowKey="name"
    headerTitle="Catalog list"
    request={async (params = {}) =>
      request<{
        catalogs: CatalogItem[];
      }>('/api/catalogs', {
        params,
      }).then((res) => {
        return {
          data: res.catalogs,
          success: true,
        };
      })
    }
    pagination={{
      pageSize: 5,
    }}
    showActions="hover"
    metas={{
      title: {
        dataIndex: 'name',
        title: 'Name',
      },
      description: {
        dataIndex: 'desc',
        search: false,
      },
      actions: {
        render: (text, row) => [
          <a href={row.url} target="_blank" rel="noopener noreferrer" key="warning">
            Detail
          </a>,
          <a href={row.url} target="_blank" rel="noopener noreferrer" key="view">
            Open
          </a>,
        ],
        search: false,
      },
      type: {
        title: 'Type',
        valueType: 'select',
        valueEnum: {
          all: { text: 'All', status: 'Default' },
          builtin: {
            text: 'Builtin',
            status: 'builtin',
          },
          helm: {
            text: 'Helm',
            status: 'helm',
          },
          terraform: {
            text: 'Terraform',
            status: 'terraform',
          },
        },
      },
    }}
  />
);
