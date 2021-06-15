import { listApplications, removeApplication } from '@/services/kubevela/applicationapi';
import { listClusterNames } from '@/services/kubevela/clusterapi';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Button, message, Space, Tooltip } from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, Link } from 'umi';
import EditForm from './EditForm';
import { vela } from '@/services/kubevela/application_pb';

const ApplicationList = (props: any) => {
  const [clusterNames, setClusterNames] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');

  const clusterEnum = {};
  clusterNames.forEach((value) => {
    clusterEnum[value] = { text: value };
  });

  const actionRef = useRef<ActionType>();


  const handleRemove = async (val: vela.api.model.Application) => {
    const hide = message.loading('Deleting');
    try {
      await removeApplication(selectedCluster, val.name);
      hide();
      message.success('Deleted successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to delete; retry again!');
      return false;
    }
  };

  useEffect(() => {
    listClusterNames().then((resp) => {
      setClusterNames(resp.clusters);
    });
  }, []);

  const columns: ProColumns<vela.api.model.Application>[] = [
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
        // https://stackoverflow.com/questions/41736048/what-is-a-state-in-link-component-of-react-router
        // https://reactrouter.com/web/api/Link
        // use props.match.params.appName and props.location.state.app
        <Link
          to={{
            pathname: `/applications/${entity.name}`,
            state: {
              app: entity,
            },
          }}
        >
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
      title: 'Components',
      dataIndex: 'components',
      hideInSearch: true,
      render: (_, entity) => (
        <>
          <Space>
            {entity.components?.map((comp) => {
              return (
                <Button type="primary" size="small">
                  {comp.type} : {comp.name}
                </Button>
              );
            })}
          </Space>
        </>
      ),
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
          <EditForm
            app={record}
            cluster={selectedCluster}
            onUpdate={() => {
              actionRef.current?.reloadAndRest?.();
            }}
          />

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

  if (clusterNames.length > 0) {
    columns.push({
      title: 'Cluster',
      dataIndex: 'cluster',
      hideInTable: true,
      filters: true,
      onFilter: true,
      valueType: 'select',
      initialValue: clusterNames[0],
      valueEnum: clusterEnum,
    });
  }

  return (
    <PageContainer loading={clusterNames.length === 0}>
      <ProTable<vela.api.model.Application>
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
          <Link to={{ pathname: `/application-input`, state: { cluster: selectedCluster } }}>
            <Button type="primary" key="primary">
              <PlusOutlined /> <FormattedMessage id="pages.table.new" defaultMessage="New" />
            </Button>
          </Link>,
        ]}
        request={async (params, sorter, filter) => {
          setSelectedCluster(params.cluster);
          const resp = await listApplications(params.cluster);
          let apps = resp.applications;

          if (params.name) {
            apps = apps.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: apps,
            success: true,
          });
        }}
      />
    </PageContainer>
  );
};

export default ApplicationList;
