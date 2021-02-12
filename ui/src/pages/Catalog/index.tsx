import React, { useRef } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Tag, Space, Menu, Dropdown } from 'antd';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable, { TableDropdown } from '@ant-design/pro-table';
import request from 'umi-request';

type CatalogItem = {
  id: string;
  name: string;
  desc: string;
  updatedAt: string;
  labels: Map<string, string>;
  url: string;
  rootdir: string;
};

const columns: ProColumns<CatalogItem>[] = [
  {
    dataIndex: 'index',
    valueType: 'indexBorder',
    width: 48,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    ellipsis: true,
    tip: '标题过长会自动收缩',
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
  },
  {
    title: 'Description',
    dataIndex: 'desc',
    search: false,
  },
  // {
  //   title: '状态',
  //   dataIndex: 'state',
  //   filters: true,
  //   onFilter: true,
  //   valueType: 'select',
  //   valueEnum: {
  //     all: { text: '全部', status: 'Default' },
  //     open: {
  //       text: '未解决',
  //       status: 'Error',
  //     },
  //     closed: {
  //       text: '已解决',
  //       status: 'Success',
  //       disabled: true,
  //     },
  //     processing: {
  //       text: '解决中',
  //       status: 'Processing',
  //     },
  //   },
  // },
  {
    title: 'Type',
    dataIndex: 'labels',
    hideInTable: true,
    filters: true,
    onFilter: true,
    valueType: 'select',
    valueEnum: {
      all: { text: 'All', status: 'Default' },
      open: {
        text: 'Helm',
        status: 'Error',
      },
      closed: {
        text: 'Terraform',
        status: 'Success',
      },
      processing: {
        text: 'Native',
        status: 'Processing',
      },
    },
  },
  {
    title: 'Labels',
    dataIndex: 'labels',
    renderFormItem: (_, { defaultRender }) => {
      return defaultRender(_);
    },
    render: (_, record) => (
      <Space>
        {record.labels &&
          Object.keys(record.labels).map((key) => (
            <Tag color={'green'} key={key}>
              {key}: {record.labels[key]}
            </Tag>
          ))}
      </Space>
    ),
  },
  {
    title: 'Last updated',
    key: 'last_updated',
    dataIndex: 'updated_at',
    // valueType: 'date',
    hideInSearch: true,
    render: (text, record) => {
      var date = new Date(record.updatedAt * 1000);
      return date.toISOString();
    },
  },
  // {
  //   title: '创建时间',
  //   dataIndex: 'created_at',
  //   valueType: 'dateRange',
  //   hideInTable: true,
  //   search: {
  //     transform: (value) => {
  //       return {
  //         startTime: value[0],
  //         endTime: value[1],
  //       };
  //     },
  //   },
  // },
  {
    title: '操作',
    valueType: 'option',
    render: (text, record, _, action) => [
      <a
        key="editable"
        onClick={() => {
          action.startEditable?.(record.id);
        }}
      >
        编辑
      </a>,
      <a href={record.url} target="_blank" rel="noopener noreferrer" key="view">
        查看
      </a>,
      <TableDropdown
        key="actionGroup"
        onSelect={() => action.reload()}
        menus={[
          { key: 'copy', name: '复制' },
          { key: 'delete', name: '删除' },
        ]}
      />,
    ],
  },
];

const menu = (
  <Menu>
    <Menu.Item key="1">1st item</Menu.Item>
    <Menu.Item key="2">2nd item</Menu.Item>
    <Menu.Item key="3">3rd item</Menu.Item>
  </Menu>
);

export default () => {
  const actionRef = useRef<ActionType>();
  return (
    <ProTable<CatalogItem>
      columns={columns}
      actionRef={actionRef}
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
      editable={{
        type: 'multiple',
      }}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      form={{
        // 由于配置了 transform，提交的参与与定义的不同这里需要转化一下
        syncToUrl: (values, type) => {
          if (type === 'get') {
            return {
              ...values,
              created_at: [values.startTime, values.endTime],
            };
          }
          return values;
        },
      }}
      pagination={{
        pageSize: 5,
      }}
      dateFormatter="string"
      headerTitle="高级表格"
      toolBarRender={() => [
        <Button key="button" icon={<PlusOutlined />} type="primary">
          新建
        </Button>,
        <Dropdown key="menu" overlay={menu}>
          <Button>
            <EllipsisOutlined />
          </Button>
        </Dropdown>,
      ]}
    />
  );
};
