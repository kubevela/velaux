import React, { useRef, useState } from 'react';
import { Button, message, Space, Tooltip } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { FormattedMessage, Link, useIntl, useModel } from 'umi';
import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-form';

const handleAdd = async (fields: API.CatalogType) => {
  const hide = message.loading('正在添加');
  try {
    // await addRule({ ...fields });
    hide();
    message.success('添加成功');
    return true;
  } catch (error) {
    hide();
    message.error('添加失败请重试！');
    return false;
  }
};

const CatalogList: React.FC = () => {
  /** 新建窗口的弹窗 */
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();

  /** 国际化配置 */
  const intl = useIntl();

  const { listCatalogs } = useModel('useCatalogs');

  const columns: ProColumns<API.CatalogType>[] = [
    {
      title: 'Index',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (dom, record) => (
        // https://ui.dev/react-router-v4-pass-props-to-link/
        <Link to={{ pathname: '/api/catalogs/' + record.name, state: { fromNotifications: true } }}>
          <a>{dom}</a>
        </Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'desc',
      search: false,
    },
    {
      title: (
        <>
          Last Updated
          <Tooltip placement="top" title="这是一段描述">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: (a, b) => a.updatedAt - b.updatedAt,
      render: (text, record) => {
        var date = new Date(record.updatedAt * 1000);
        return date.toISOString();
      },
    },

    {
      title: <FormattedMessage id="pages.catalogTable.titleOption" defaultMessage="操作" />,
      width: '164px',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button id="sync" onClick={() => message.success('ok')}>
            <FormattedMessage id="pages.catalogTable.sync" defaultMessage="同步" />
          </Button>
          <Button id="edit" type="primary" onClick={() => message.success('ok')}>
            <FormattedMessage id="pages.catalogTable.edit" defaultMessage="编辑" />
          </Button>
          <Button id="delete" type="primary" danger onClick={() => message.success('ok')}>
            <FormattedMessage id="pages.catalogTable.delete" defaultMessage="删除" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.CatalogType>
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
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalVisible(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.catalogTable.new" defaultMessage="新建" />
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          // 表单搜索项会从 params 传入，传递给后端接口。
          console.log('params', params, 'sorter', sorter, 'filter', filter);

          const catalogs = await listCatalogs();

          let filtered: API.CatalogType[] = [];

          if (!params.name) {
            filtered = catalogs;
          } else {
            filtered = catalogs.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: filtered,
            success: true,
          });
        }}
      />

      <ModalForm
        title={intl.formatMessage({
          id: 'pages.catalogTable.createForm.newRule',
          defaultMessage: '新建规则',
        })}
        width="400px"
        visible={createModalVisible}
        onVisibleChange={handleModalVisible}
        onFinish={async (value) => {
          const success = await handleAdd(value as API.CatalogType);
          if (success) {
            handleModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.catalogTable.ruleName"
                  defaultMessage="规则名称为必填项"
                />
              ),
            },
          ]}
          width="md"
          name="name"
        />
        <ProFormTextArea width="md" name="desc" />
      </ModalForm>
    </PageContainer>
  );
};

export default CatalogList;
