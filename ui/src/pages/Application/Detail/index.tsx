import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { Typography } from 'antd';
import moment from 'moment';
import React from 'react';
export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  const app: API.ApplicationType = props.location?.state?.app;

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{ content: '' }} // disable watermark
      header={{
        title: <Typography.Title level={2}>{app?.name}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'Applications',
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[16, 16]}>
        <ProCard gutter={16} style={{ minHeight: 200 }}>
          <ProCard colSpan={16}> Description: {app?.desc}</ProCard>
          <ProCard colSpan={8}>Last updated: {moment(app?.updatedAt).format()}</ProCard>
        </ProCard>

        <ProCard gutter={16} ghost style={{ minHeight: 200 }}>
          <ProCard colSpan={16} title="Components">
            <ul>
              {app?.components?.map((comp) => (
                <li>{comp.name}</li>
              ))}
            </ul>
          </ProCard>
          <ProCard colSpan={8}>Health status: Running</ProCard>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
