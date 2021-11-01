import React from 'react';
import './index.less';

export default function LoginPage(props: any) {
  const { name, password } = props.location.state.data.data;
  return (
    <div>
      Success: name:{name}, password:{password}
    </div>
  );
}
