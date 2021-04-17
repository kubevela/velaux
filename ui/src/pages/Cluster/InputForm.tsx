import React from 'react';
import ProForm, { ProFormText, ModalForm } from '@ant-design/pro-form';
import { useIntl } from 'umi';

export type InputFormProps = {
  title: string;
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: API.ClusterType;
};

const InputForm: React.FC<InputFormProps> = (props) => {
  const intl = useIntl();
  return (
    <ModalForm
      title={props.title}
      visible={props.visible}
      onFinish={props.onFinish}
      onVisibleChange={props.onVisibleChange}
      rules={[{ required: true, message: 'Missing name' }]}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="name"
          label="Name"
          tooltip="最长为 24 位"
          placeholder="请输入名称"
          initialValue={props.initialValues?.name}
        />
        <ProFormText
          width="md"
          name="desc"
          label="Description"
          placeholder="请输入名称"
          initialValue={props.initialValues?.desc}
        />
      </ProForm.Group>
      <ProFormText
        width="lg"
        name="kubeconfig"
        label="kubeconfig"
        placeholder="请输入名称"
        initialValue={props.initialValues?.kubeconfig}
      />
      {/* <ProFormText name="project" disabled label="项目名称" initialValue="xxxx项目" /> */}
    </ModalForm>
  );
};

export default InputForm;
