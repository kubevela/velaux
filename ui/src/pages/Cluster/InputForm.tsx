import ProForm, { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import { Input } from 'antd';
import React from 'react';
import {vela} from "@/services/kubevela/cluster_pb";

export type InputFormProps = {
  title: string;
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: vela.api.model.Cluster;
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
          initialValue={props.initialValues?.name}
        />
        <ProFormText
          width="md"
          name="desc"
          label="Description"
          initialValue={props.initialValues?.desc}
        />
      </ProForm.Group>

      <ProFormTextArea
        width="lg"
        name="kubeconfig"
        label="kubeconfig"
        initialValue={props.initialValues?.kubeconfig}
      />
      {/* <ProFormText name="project" disabled label="项目名称" initialValue="xxxx项目" /> */}
    </ModalForm>
  );
};

export default InputForm;
