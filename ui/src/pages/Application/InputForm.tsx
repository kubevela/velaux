import ProForm, { ModalForm, ProFormText } from '@ant-design/pro-form';
import React from 'react';

export type InputFormProps = {
  title: string;
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: API.ApplicationType;
};

const InputForm = (props: InputFormProps) => {
  return (
    <ModalForm
      title={props.title}
      visible={props.visible}
      onFinish={props.onFinish}
      onVisibleChange={props.onVisibleChange}
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
      {/* <ProFormText name="project" disabled label="项目名称" initialValue="xxxx项目" /> */}
    </ModalForm>
  );
};

export default InputForm;
