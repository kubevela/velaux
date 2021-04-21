// @ts-ignore
import { Theme as AntDTheme } from '@rjsf/antd';
import { withTheme } from '@rjsf/core';
import { Card } from 'antd';
import 'antd/dist/antd.css';
import React, { useEffect, useState } from 'react';
import CapabilitySelector from '../CapabilitySelector';

const FormRender = withTheme(AntDTheme);

export interface CapabilityFormData {
  type: string;
  data: object;
}
interface FormProps {
  onChange: (currentData: CapabilityFormData, oldData?: CapabilityFormData) => void;

  disableCapabilities?: string[];
  caps: API.CapabilityType[];
}

export default ({ onChange, disableCapabilities, caps }: FormProps) => {
  const [schema, setSchema] = useState<object>();
  const [selectType, setSelectType] = useState<string>();
  const [data, setData] = useState<CapabilityFormData>();
  useEffect(() => {
    if (selectType == null) {
      return;
    }
    caps.forEach((cap) => {
      if (cap.name === selectType) {
        setSchema(JSON.parse(cap.jsonschema));
      }
    });
  }, [selectType]);
  return (
    <div>
      <CapabilitySelector
        onSelect={(name) => {
          setSelectType(name);
        }}
        disableCapabilities={disableCapabilities}
        caps={caps}
      />
      {schema == null ? null : (
        <div style={{ marginTop: '10px' }}>
          <Card title={selectType}>
            <FormRender
              schema={schema}
              formData={data?.data ?? {}}
              onChange={(fd) => {
                const newData = { type: selectType as string, data: fd.formData ?? {} };
                setData(newData);
                onChange(newData, data);
              }}
              children={true} // Without this there will be a submit button for each rendered form
            />
          </Card>
        </div>
      )}
    </div>
  );
};
