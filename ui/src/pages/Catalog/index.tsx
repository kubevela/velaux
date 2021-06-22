import {addCatalog, listCatalogs, removeCatalog, updateCatalog,} from '@/services/kubevela/catalogapi';
import {PlusOutlined} from '@ant-design/icons';
import {PageContainer} from '@ant-design/pro-layout';
import type {ActionType, ProColumns} from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import {Button, message, Space} from 'antd';
import moment from 'moment';
import {useRef, useState} from 'react';
import {FormattedMessage, Link} from 'umi';
import InputForm from './InputForm';

interface UpdateState {
  visible: boolean;
  value?: API.CatalogType;
}

const CatalogList = () => {
  const [createModalVisible, handleCreateModalVisible] = useState<boolean>(false);
  const [updateModal, handleUpdateModal] = useState<UpdateState>({visible: false});

  const actionRef = useRef<ActionType>();

  const handleAdd = async (fields: API.CatalogType) => {
    const hide = message.loading('Adding');
    try {
      await addCatalog({...fields});
      hide();
      message.success('Added successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to add; retry again!');
      return false;
    }
  };

  const handleUpdate = async (val: API.CatalogType) => {
    const hide = message.loading('Updating');
    try {
      const newVal = await updateCatalog(val);
      handleUpdateModal({...updateModal, value: newVal.catalog});
      hide();
      message.success('Updated successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to update; retry again!');
      return false;
    }
  };

  const handleRemove = async (val: API.CatalogType) => {
    const hide = message.loading('Deleting');
    try {
      await removeCatalog(val);
      hide();
      message.success('Deleted successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to delete; retry again!');
      return false;
    }
  };

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
      render: (dom, entity) => (
        <Link to={{pathname: `/catalogs/${entity.name}`}}>
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
        <div>
          Last Updated
        </div>
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
      title: <FormattedMessage id="pages.table.titleOption" defaultMessage="Option"/>,
      width: '164px',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            id="edit"
            type="primary"
            onClick={() => {
              handleUpdateModal({visible: true, value: record});
            }}
          >
            <FormattedMessage id="pages.table.edit" defaultMessage="Edit"/>
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
            <FormattedMessage id="pages.table.delete" defaultMessage="Delete"/>
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
            <PlusOutlined/> <FormattedMessage id="pages.table.new" defaultMessage="New"/>
          </Button>,
        ]}
        request={async (params) => {
          const resp = await listCatalogs();
          let {catalogs} = resp;

          if (params.name) {
            catalogs = catalogs.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: catalogs,
            success: true,
          });
        }}
      />

      <InputForm
        title={'Create Catalog'}
        visible={createModalVisible}
        onFinish={async (value: any) => {
          const success = await handleAdd(value as API.CatalogType);
          if (success) {
            handleCreateModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleCreateModalVisible(visible);
        }}
      />

      <InputForm
        title={'Update Catalog'}
        visible={updateModal.visible}
        onFinish={async (value: any) => {
          const success = await handleUpdate(value as API.CatalogType);
          if (success) {
            handleUpdateModal({...updateModal, visible: false});
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }

          message.success('提交成功');
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleUpdateModal({...updateModal, visible});
        }}
        initialValues={updateModal.value}
      />
    </PageContainer>
  );
};

export default CatalogList;
