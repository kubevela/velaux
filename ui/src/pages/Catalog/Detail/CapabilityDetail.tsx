import {ModalForm} from '@ant-design/pro-form';
import {Typography} from "antd";

export type CapabilityDetailProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  capability: API.CatalogCapabilityType;
};

export default (props: CapabilityDetailProps) => {
  return (
    <ModalForm
      title='Capability Detail'
      visible={props.visible}
      onVisibleChange={props.onVisibleChange}
      modalProps={{cancelText: 'Close'}}
    >
      <Typography.Paragraph>Name: {props.capability.name}</Typography.Paragraph>
      <Typography.Paragraph>Desc: {props.capability.desc}</Typography.Paragraph>
      <Typography.Paragraph>Type: {props.capability.type}</Typography.Paragraph>
      <Typography.Paragraph>JSON Schema: <pre>{props.capability.jsonschema}</pre></Typography.Paragraph>
    </ModalForm>
  );
};
