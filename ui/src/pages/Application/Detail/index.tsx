import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { Typography } from 'antd';
import React from 'react';
export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  const appName = props.match.params.appName;

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{ content: '' }} // disable watermark
      header={{
        title: <Typography.Title level={2}>{appName}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'Applications',
            },
            {
              path: '',
              breadcrumbName: appName,
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[16, 16]}>
        <ProCard style={{ height: 200 }} headerBordered>
          Application
        </ProCard>

        <ProCard gutter={16} ghost style={{ minHeight: 200 }}>
          <ProCard colSpan={16}>Application</ProCard>
          <ProCard colSpan={8}>Application</ProCard>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
