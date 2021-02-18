import React from 'react';
import ProForm, {
  StepsForm,
  ProFormText,
  ProFormDatePicker,
  ProFormSelect,
  ProFormCheckbox,
} from '@ant-design/pro-form';
import ProCard from '@ant-design/pro-card';
import { message } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';

export type FormProps = {};

const CreateForm: React.FC<FormProps> = (props) => {
  return (
    <PageContainer>
      <ProCard>
        <StepsForm<API.ApplicationType>
          onFinish={async (value) => {
            console.log('form total', value);
            message.success('提交成功');
          }}
          formProps={{
            validateMessages: {
              required: '此项为必填项',
            },
          }}
        >
          <StepsForm.StepForm<{
            name: string;
            desc: string;
            env: string;
          }>
            name="base"
            title="Basic info"
            onFinish={async (value) => {
              console.log('form 1', value);
              return true;
            }}
          >
            <ProFormText
              width="md"
              name="name"
              label="Name"
              tooltip="最长为 24 位"
              placeholder="请输入名称"
            />
            <ProFormText width="md" name="desc" label="Description" placeholder="请输入名称" />
            <ProFormSelect
              width="md"
              request={async () => [{ value: 'Environment' }, { value: 'Environment-2' }]}
              name="env"
              label="Choose environment"
            />
          </StepsForm.StepForm>

          <StepsForm.StepForm<{
            checkbox: string;
          }>
            name="checkbox"
            title="设置参数"
          >
            <ProFormCheckbox.Group
              name="checkbox"
              label="迁移类型"
              width="lg"
              options={['结构迁移', '全量迁移', '增量迁移', '全量校验']}
            />
            <ProForm.Group>
              <ProFormText name="dbname" label="业务 DB 用户名" />
              <ProFormDatePicker name="datetime" label="记录保存时间" width="sm" />
              <ProFormCheckbox.Group
                name="checkbox"
                label="迁移类型"
                options={['完整 LOB', '不同步 LOB', '受限制 LOB']}
              />
            </ProForm.Group>
          </StepsForm.StepForm>
          <StepsForm.StepForm name="time" title="发布实验">
            <ProFormCheckbox.Group
              name="checkbox"
              label="部署单元"
              options={['部署单元1', '部署单元2', '部署单元3']}
            />
            <ProFormSelect
              label="部署分组策略"
              name="remark"
              rules={[
                {
                  required: true,
                },
              ]}
              initialValue="1"
              options={[
                {
                  value: '1',
                  label: '策略一',
                },
                { value: '2', label: '策略二' },
              ]}
            />
            <ProFormSelect
              label="Pod 调度策略"
              name="remark2"
              initialValue="2"
              options={[
                {
                  value: '1',
                  label: '策略一',
                },
                { value: '2', label: '策略二' },
              ]}
            />
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </PageContainer>
  );
};

export default CreateForm;
