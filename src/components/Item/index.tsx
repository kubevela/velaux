import React from 'react';

export type Props = {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  labelWidth?: number;
  marginBottom?: string;
};

const Item: React.FC<Props> = (props) => {
  return (
    <div style={{ marginBottom: props.marginBottom || '16px', display: 'flex' }}>
      <div
        style={{
          width: props.labelWidth || '140px',
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '14px', color: '#a6a6a6' }}>{props.label}:</span>
      </div>
      <div style={{ fontSize: '14px', display: 'flex', flex: 1 }}>{props.value}</div>
    </div>
  );
};

export default Item;
