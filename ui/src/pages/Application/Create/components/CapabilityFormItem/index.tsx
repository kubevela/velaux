// @ts-ignore
import { Theme as AntDTheme } from '@rjsf/antd';
import { withTheme } from '@rjsf/core';
import { Card } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useState } from 'react';
import CapabilitySelector, { CapabilitySelectorProps } from '../CapabilitySelector';

const FormRender = withTheme(AntDTheme);

export interface CapabilityFormItemData {
  type: string;
  data: object;
}
interface CapabilityFormItemProps extends CapabilitySelectorProps {
  onChange?: (currentData: CapabilityFormItemData, oldData?: CapabilityFormItemData) => void;
  caps: { name: string; jsonschema: string }[];
}

export default ({ onChange, onSelect, disableCapabilities, caps }: CapabilityFormItemProps) => {
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
                const newData = { type: value as string, data: fd.formData ?? {} };
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
