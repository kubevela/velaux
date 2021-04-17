import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import React from 'react';
import { Link } from 'umi';

export default (props: any) => {
  // @ts-ignore
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  const clusterName = props.match.params.clusterName;

  return (
    <div
      style={{
        background: '#F5F7FA',
      }}
    >
      <PageContainer
        fixedHeader
        header={{
          title: '页面标题',
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
        tabList={[
          {
            tab: '已选择',
            key: '1',
          },
          {
            tab: '可点击',
            key: '2',
          },
          {
            tab: '禁用',
            key: '3',
            disabled: true,
          },
        ]}
      >
        <ProCard direction="column" ghost gutter={[0, 16]}>
          <ProCard style={{ height: 200 }} />
          <ProCard gutter={16} ghost style={{ height: 200 }}>
            <ProCard colSpan={16} />
            <ProCard colSpan={8} />
          </ProCard>
        </ProCard>
      </PageContainer>
    </div>
  );
};
