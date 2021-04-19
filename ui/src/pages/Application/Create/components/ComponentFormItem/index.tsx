import { Card, Form, Input } from 'antd';
import React from 'react';
import CapabilityFormItem from '../CapabilityFormItem';
import TraitsFrom from '../TraitsFrom';

export interface ComponentEntry extends API.ComponentType {
  id: number;
}

interface ComponentFormItemProps {
  component: ComponentEntry;
  setComponent: (service: ComponentEntry) => void;
  compDefs: API.ComponentDefinition[];
  traitDefs: API.TraitDefinition[];
}

export default ({ component, setComponent, compDefs, traitDefs }: ComponentFormItemProps) => {
  return (
    <div>
      <Form.Item
        name={['component', component.id, 'name']}
        label="Name"
        required
        rules={[{ required: true, max: 200 }]}
      >
        <Input
          placeholder="Component name"
          onChange={(e) => setComponent({ ...component, name: e.target.value })}
        />
      </Form.Item>

      <Form.Item
        name={['component', component.id, 'type']}
        label="Workload Type"
        required
        rules={[{ required: true }]}
      >
        <CapabilityFormItem
          onChange={(wd) => {
            setComponent({ ...component, properties: wd.data, type: wd.type });
          }}
          caps={compDefs}
        />
      </Form.Item>
      <Card title="Traits">
        <TraitsFrom
          onChange={(td) => setComponent({ ...component, traits: td })}
          caps={traitDefs}
        />
      </Card>
    </div>
  );
};
