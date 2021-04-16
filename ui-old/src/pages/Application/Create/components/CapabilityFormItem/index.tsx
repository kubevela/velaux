import React, { useEffect, useState } from 'react';

import { withTheme } from '@rjsf/core';
// @ts-ignore
import { Theme as AntDTheme } from '@rjsf/antd';
import 'antd/dist/antd.css';
const FormRender = withTheme(AntDTheme);

import CapabilitySelector, { CapabilitySelectorProps } from '../CapabilitySelector';
import { Card } from 'antd';

export interface CapabilityFormItemData {
  capabilityType: string;
  data: object;
}
interface CapabilityFormItemProps extends CapabilitySelectorProps {
  onChange?: (currentData: CapabilityFormItemData, oldData?: CapabilityFormItemData) => void;
  caps: API.CapabilityType[];
}
const CapabilityFormItem: React.FC<CapabilityFormItemProps> = ({
  onChange,
  onSelect,
  disableCapabilities,
  caps,
}) => {
  const [schema, setSchema] = useState<object>();
  const [value, setValue] = useState<string>();
  const [data, setData] = useState<CapabilityFormItemData>();
  useEffect(() => {
    if (value == null) {
      return;
    }
    caps.forEach((cap) => {
      if (cap.name === value) {
        setSchema(JSON.parse(cap.jsonschema));
      }
    });
  }, [value]);
  return (
    <div>
      <CapabilitySelector
        onSelect={(name) => {
          setValue(name);
          if (onSelect != null) {
            onSelect(name);
          }
        }}
        disableCapabilities={disableCapabilities}
        caps={caps}
      />
      {schema == null ? null : (
        <div style={{ marginTop: '10px' }}>
          <Card title={value}>
            <FormRender
              schema={schema}
              formData={data?.data ?? {}}
              onChange={(fd) => {
                const newData = { capabilityType: value as string, data: fd.formData ?? {} };
                setData(newData);
                if (onChange != null) {
                  onChange(newData, data);
                }
              }}
              children={true}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default CapabilityFormItem;
