import {
  addCluster,
  listClusters,
  removeCluster,
  updateCluster,
} from '@/services/kubevela/clusterapi';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Button, message, Space, Tooltip } from 'antd';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import { FormattedMessage, Link } from 'umi';
import InputForm from './InputForm';
import { vela } from '@/services/kubevela/cluster_pb'

interface UpdateState {
  visible: boolean;
  value?: vela.api.model.Cluster;
}

const ClusterList = () => {
  /** 新建窗口的弹窗 */
  const [createModalVisible, handleCreateModalVisible] = useState<boolean>(false);
  const [updateModal, handleUpdateModal] = useState<UpdateState>({ visible: false });

  const actionRef = useRef<ActionType>();

  const handleAdd = async (fields: vela.api.model.Cluster) => {
    const hide = message.loading('Adding');
    try {
      await addCluster({ ...fields });
      hide();
      message.success('Added successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to add; retry again!');
      return false;
    }
  };

  const handleUpdate = async (val: vela.api.model.Cluster) => {
    const hide = message.loading('Updating');
    try {
      const newVal = await updateCluster(val);
      handleUpdateModal({ ...updateModal, value: newVal.cluster });
      hide();
      message.success('Updated successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to update; retry again!');
      return false;
    }
  };

  const handleRemove = async (val: vela.api.model.Cluster) => {
    const hide = message.loading('Deleting');
    try {
      await removeCluster(val);
      hide();
      message.success('Deleted successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to delete; retry again!');
      return false;
    }
  };

  const columns: ProColumns<vela.api.model.Cluster>[] = [
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
        // https://pro.ant.design/docs/router-and-nav-cn
        // 带参数的路由
        <Link to={{ pathname: '/clusters/' + entity.name }}>
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
          <Tooltip placement="top" title="Last updated time">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      search: false,
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: (a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return a.updatedAt - b.updatedAt;
        }
        return 0;
      },
      render: (_, record) => {
        if (record.updatedAt) {
          return moment(record.updatedAt).format('YYYY-MM-DD');
        }
        return '';
      },
    },

    {
      title: <FormattedMessage id="pages.table.titleOption" defaultMessage="Option" />,
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
            <FormattedMessage id="pages.table.edit" defaultMessage="Edit" />
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
            <FormattedMessage id="pages.table.delete" defaultMessage="Delete" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<vela.api.model.Cluster>
        columns={columns}
        rowKey="key"
        dateFormatter="string"
        headerTitle="Table"
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
            <PlusOutlined /> <FormattedMessage id="pages.table.new" defaultMessage="New" />
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          let resp = await listClusters();
          let clusters = resp.clusters;

          if (params.name) {
            clusters = clusters.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: clusters,
            success: true,
          });
        }}
      />

      <InputForm
        title={'Create Cluster'}
        visible={createModalVisible}
        onFinish={async (value: any) => {
          const success = await handleAdd(value as vela.api.model.Cluster);
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

      <InputForm
        title={'Update Cluster'}
        visible={updateModal.visible}
        onFinish={async (value: any) => {
          const success = await handleUpdate(value as vela.api.model.Cluster);
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

export default ClusterList;
