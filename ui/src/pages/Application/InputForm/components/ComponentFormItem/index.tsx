import { Card, Form, Input } from 'antd';
import React from 'react';
import CapabilityFormItem from '../CapabilityForm';
import TraitsForm from '../TraitsForm';

export interface ComponentEntry extends API.ComponentType {
  id: number;
}

interface FormProps {
  component: ComponentEntry;
  setComponent: (service: ComponentEntry) => void;
  compDefs: API.CapabilityType[];
  traitDefs: API.CapabilityType[];
}

export default ({ component, setComponent, compDefs, traitDefs }: FormProps) => {
  console.log(compDefs)
  return (
    <div>
      <Form.Item label="Name" required rules={[{ required: true, max: 200 }]}>
        <Input
          placeholder="Component name"
          onChange={(e) => {
            setComponent({ ...component, name: e.target.value });
          }}
        />
      </Form.Item>

      <Form.Item label="Workload Type" required rules={[{ required: true }]}>
        <CapabilityFormItem
          onChange={(wd) => {
            setComponent({ ...component, properties: wd.data, type: wd.type });
          }}
          caps={compDefs}
        />
      </Form.Item>
      <Card title="Traits">
        <TraitsForm
          onChange={(td) => setComponent({ ...component, traits: td })}
          caps={traitDefs}
        />
      </Card>
    </div>
  );
};
