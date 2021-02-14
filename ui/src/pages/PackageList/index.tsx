import React, { useRef } from 'react';
import { Button, message, Space, Tag } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { FormattedMessage } from 'umi';
import { listPackages } from '@/services/catalog';

const colors = ['blue', 'purple', 'pink',  'orange', 'cyan', 'green'];

const PackageList: React.FC = (props) => {
  // @ts-ignore
  const catalogName = props.match.params.catalogName;

  const actionRef = useRef<ActionType>();

  const handleInstallPackage = async () => {
    message.success('安装成功');
  };

  const columns: ProColumns<API.PackageType>[] = [
    {
      title: 'Index',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      search: false,
    },
    {
      title: '标签',
      dataIndex: 'labels',
      width: 48,
      search: false,
      render: (_, record) => (
        <Space>
          {record.labels?.map((label, index) => (
            <Tag color={colors[index % colors.length]} key={label}>
              {label}
            </Tag>
          ))}
        </Space>
      ),
    },

    {
      title: <FormattedMessage id="pages.packageList.titleOption" defaultMessage="操作" />,
      width: '164px',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button id="install" onClick={handleInstallPackage}>
            <FormattedMessage id="pages.packageList.install" defaultMessage="安装" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.PackageType>
        columns={columns}
        rowKey="key"
        dateFormatter="string"
        headerTitle="查询表格"
        actionRef={actionRef}
        pagination={{
          showQuickJumper: true,
        }}
        search={{
          // filterType: 'light',
          labelWidth: 120,
        }}
        request={async (params, sorter, filter) => {
          // 表单搜索项会从 params 传入，传递给后端接口。
          console.log('params', params, 'sorter', sorter, 'filter', filter);

          let { packages } = await listPackages(catalogName);

          if (params.name) {
            packages = packages.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: packages,
            success: true,
          });
        }}
      />
    </PageContainer>
  );
};

export default PackageList;
