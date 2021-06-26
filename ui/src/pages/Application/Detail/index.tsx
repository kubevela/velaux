import React, {useEffect, useState} from 'react';
import ProCard from '@ant-design/pro-card';
import {PageContainer} from '@ant-design/pro-layout';
import {Descriptions, Space, Tag, Timeline, Typography} from 'antd';
import ProList from '@ant-design/pro-list';
import {BuildOutlined, CheckCircleTwoTone, CloseCircleTwoTone} from '@ant-design/icons';
import moment from 'moment';
import TraitCard from './components/TraitCard'
import EventTimeline from './components/EventTimeline'
import {getApplication} from "@/services/kubevela/applicationapi";

export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  // const app: API.ApplicationType = props.location?.state?.app;
  const [app, setapp] = useState<API.ApplicationDetailType>();

  useEffect(() => {
    console.log(props.location?.state?.cluster)
    getApplication(props.location?.state?.cluster, props.location?.state?.app.name).then((resp) => {
      setapp(resp.application);
    });
  }, []);

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{content: ''}} // disable watermark
      header={{
        title: <Typography.Title level={2}>{app?.name}</Typography.Title>,
      }}
      content={
        <Descriptions column={2} style={{marginBottom: -16}}>
          <Descriptions.Item label="Description">{app?.desc}</Descriptions.Item>
          <Descriptions.Item label="Last updated">{moment(app?.updatedAt).format('YYYY-MM-DD')}</Descriptions.Item>
        </Descriptions>
      }
    >
      <ProCard direction="column" ghost gutter={[16, 16]} wrap>
        <ProCard gutter={16} ghost style={{minHeight: 200}}>
          <ProList<any>
            pagination={{
              defaultPageSize: 2,
              showSizeChanger: false,
            }}
            grid={{gutter: 16, column: 2}}
            metas={{
              title: {
                dataIndex: 'name'
              },
              subTitle: {
                dataIndex: 'workload',
                render: (key) => {
                  return (
                    <Space size={0}>
                      <Tag color="blue">{key}</Tag>
                    </Space>
                  );
                },
              },
              // actions: {
              //   render: (_, record) => {
              //     return <a>详情</a>
              //   },
              // },
              avatar: {
                render: () => {
                  return (
                    <a><BuildOutlined/></a>
                  );
                },
              },
              content: {
                render: (_, record) => {
                  return (
                    <>
                      <ProCard
                        split='horizontal'
                        size="small"
                        wrap
                      >
                        <ProCard gutter={[16, 16]} wrap>
                          <ProCard colSpan={6} title="Type">
                            {record.type}
                          </ProCard>
                          <ProCard colSpan={6} title="Namespace">
                            {record.namespace}
                          </ProCard>
                          <ProCard colSpan={6} title="Phase">
                            {record.phase === 'running' ?
                              <Tag color="green">{record.phase}</Tag>
                              :
                              <Tag color="orange">{record.phase}</Tag>
                            }
                          </ProCard>
                          <ProCard colSpan={6} title="Health">
                            {record.health ?
                              <a><CheckCircleTwoTone twoToneColor="#52c41a" style={{fontSize: '20px'}}/></a>
                              :
                              <a><CloseCircleTwoTone twoToneColor="#eb2f96" style={{fontSize: '20px'}}/></a>
                            }
                          </ProCard>
                          <ProCard colSpan={24} title="Describe">
                            {record.desc}
                          </ProCard>
                        </ProCard>
                        <ProCard style={{minHeight: 250}}>
                          <TraitCard traits={record.traits}/>
                        </ProCard>
                      </ProCard>
                    </>
                  )
                },
              }
            }}
            headerTitle="Components"
            dataSource={app?.components}
          />
        </ProCard>

        <ProCard gutter={16} ghost style={{minHeight: 200}}>
          <ProCard title="Event">
            <Timeline>
              {app?.events?.map((item) =>
                <EventTimeline event={item}/>
              )}
            </Timeline>
          </ProCard>
        </ProCard>

      </ProCard>
    </PageContainer>
  );
};
