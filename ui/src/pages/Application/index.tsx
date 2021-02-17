import React, { useRef, useState } from 'react';
import { Button, message, Space, Tooltip } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { FormattedMessage, useModel } from 'umi';
import UpdateForm from './components/UpdateForm';

interface UpdateState {
  visible: boolean;
  value?: API.ApplicationType;
}

const ApplicationList: React.FC = () => {
  /** 新建窗口的弹窗 */
  const [createModalVisible, handleCreateModalVisible] = useState<boolean>(false);
  const [updateModal, handleUpdateModal] = useState<UpdateState>({ visible: false });

  const actionRef = useRef<ActionType>();

  const { listApplications, addApplication, removeApplication, updateApplication } = useModel(
    'useApplications',
  );

  const handleAdd = async (fields: API.ApplicationType) => {
    console.log('fields', fields);
    const hide = message.loading('正在添加');
    try {
      await addApplication({ ...fields });
      hide();
      message.success('添加成功');
      return true;
    } catch (error) {
      hide();
      message.error('添加失败请重试！');
      return false;
    }
  };

  const handleUpdate = async (val: API.ApplicationType) => {
    const hide = message.loading('正在更改');
    try {
      const newVal = await updateApplication(val);
      handleUpdateModal({ ...updateModal, value: newVal });
      hide();
      message.success('更改成功，即将刷新');
      return true;
    } catch (error) {
      hide();
      message.error('更改失败，请重试');
      return false;
    }
  };

  const handleRemove = async (val: API.ApplicationType) => {
    const hide = message.loading('正在删除');
    try {
      await removeApplication(val);
      hide();
      message.success('删除成功，即将刷新');
      return true;
    } catch (error) {
      hide();
      message.error('删除失败，请重试');
      return false;
    }
  };

  const columns: ProColumns<API.ApplicationType>[] = [
    {
      title: 'Index',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (dom, entity) => (
        <a
          onClick={() => {
            // setShowDetail(true);
            message.warning('TODO: 展示 application');
          }}
        >
          {dom}
        </a>
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
          <Tooltip placement="top" title="Last updated time">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: (a, b) => a.updatedAt - b.updatedAt,
      render: (_, record) => {
        var date = new Date(record.updatedAt * 1000);
        return date.toLocaleString();
      },
    },

    {
      title: <FormattedMessage id="pages.applicationTable.titleOption" defaultMessage="操作" />,
      width: '164px',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            id="edit"
            type="primary"
            onClick={() => {
              handleUpdateModal({ visible: true, value: record });
            }}
          >
            <FormattedMessage id="pages.applicationTable.edit" defaultMessage="编辑" />
          </Button>
          <Button
            id="delete"
            type="primary"
            danger
            onClick={() => {
              handleRemove(record);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage id="pages.applicationTable.delete" defaultMessage="删除" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ApplicationType>
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
              handleCreateModalVisible(true);
            }}
          >
            <PlusOutlined />{' '}
            <FormattedMessage id="pages.applicationTable.new" defaultMessage="新建" />
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          // 表单搜索项会从 params 传入，传递给后端接口。
          console.log('params', params, 'sorter', sorter, 'filter', filter);

          let apps = await listApplications();

          if (params.name) {
            apps = apps.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: apps,
            success: true,
          });
        }}
      />

      <UpdateForm
        title={{
          id: 'pages.applicationTable.updateForm.newApplication',
          defaultMessage: 'Create Application',
        }}
        visible={createModalVisible}
        onFinish={async (value: any) => {
          const success = await handleAdd(value as API.ApplicationType);
          if (success) {
            handleCreateModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }

          message.success('提交成功');
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleCreateModalVisible(visible);
        }}
      />

      <UpdateForm
        title={{
          id: 'pages.applicationTable.updateForm.updateApplication',
          defaultMessage: 'Update Application',
        }}
        visible={updateModal.visible}
        onFinish={async (value: any) => {
          const success = await handleUpdate(value as API.ApplicationType);
          if (success) {
            handleUpdateModal({ ...updateModal, visible: false });
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }

          message.success('提交成功');
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleUpdateModal({ ...updateModal, visible });
        }}
        initialValues={updateModal.value}
      />
    </PageContainer>
  );
};

export default ApplicationList;
