import React from 'react';

export function If(props: { children: React.ReactNode; condition: unknown }) {
  if (props.condition) {
    return props.children as any;
  }
  return <div></div>;
}
