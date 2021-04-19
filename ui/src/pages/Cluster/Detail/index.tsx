import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, List, message, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import { listComponentDefinitions, listTraitDefinitions } from '@/services/kubevela/clusterapi';
export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  const clusterName = props.match.params.clusterName;

  const [compDefs, setCompDefs] = useState<API.CapabilityType[]>([]);
  const [traitDefs, setTraitDefs] = useState<API.CapabilityType[]>([]);

  useEffect(() => {
    listComponentDefinitions(clusterName).then((resp) => {
      setCompDefs(resp.componentDefinitions);
    });
    listTraitDefinitions(clusterName).then((resp) => {
      setTraitDefs(resp.traitDefinitions);
    });
  }, []);

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{ content: '' }} // disable watermark
      header={{
        title: <Typography.Title level={2}>{clusterName}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'Clusters',
            },
            {
              path: '',
              breadcrumbName: clusterName,
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[16, 16]}>
        <ProCard>
          <ProCard>
            <Typography.Title level={3}>KubeVela Controller</Typography.Title>
          </ProCard>
          <ProCard className={styles.desc}>
            <Typography.Text type="secondary">Status:</Typography.Text>{' '}
            <Typography.Text type="success">Latest</Typography.Text>
          </ProCard>
          <ProCard>
            <Space style={{ float: 'right' }}>
              <Button type="primary" size={'large'}>
                Install KubeVela
              </Button>
            </Space>
          </ProCard>
        </ProCard>

        <ProCard gutter={16} ghost style={{ minHeight: 200 }}>
          <ProCard title="ComponentDefinition" colSpan={16}>
            <List
              dataSource={compDefs}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical">
                    <Typography.Title level={5}>{item.name}</Typography.Title>
                    <Typography.Text type="secondary"> {item.desc}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
          <ProCard title="TraitDefinition" colSpan={16}>
            <List
              dataSource={traitDefs}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical">
                    <Typography.Title level={5}>{item.name}</Typography.Title>
                    <Typography.Text type="secondary"> {item.desc}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
