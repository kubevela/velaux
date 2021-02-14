import React from 'react';
import ProForm, { ProFormSelect, ProFormText, ModalForm } from '@ant-design/pro-form';
import { useIntl } from 'umi';

export type FormTitleType = {
  id?: string;
  defaultMessage?: string;
};

export type UpdateFormProps = {
  title: FormTitleType;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onFinish: any;
  initialValues?: API.CatalogType;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  return (
    <ModalForm
      title={intl.formatMessage({
        id: props.title.id,
        defaultMessage: props.title.defaultMessage,
      })}
      visible={props.visible}
      onVisibleChange={props.onVisibleChange}
      onFinish={props.onFinish}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="name"
          label="Catalog Name"
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
      <ProForm.Group>
        <ProFormSelect
          disabled
          options={[
            {
              value: 'git',
              label: 'Git',
            },
          ]}
          width="xs"
          name="protocol"
          label="Protocol"
          initialValue="git"
        />
        <ProFormText width="lg" name="url" label="URL" placeholder="请输入名称" />
        <ProFormText width="xs" name="rootdir" label="Root Directory" placeholder="请输入名称" />
      </ProForm.Group>
      {/* <ProFormText name="project" disabled label="项目名称" initialValue="xxxx项目" /> */}
    </ModalForm>
  );
};

export default UpdateForm;
