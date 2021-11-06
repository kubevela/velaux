import React from 'react';
import { Card, Button } from '@b-design/ui';
import { APP_POLICIES } from '../../constants';

type Props = {
  appName: string;
  status: string;
  policies: [];
};

export default function Policies(props: Props) {
  const { appName, status, policies } = props;
  const appPolicy = (policies || []).map((item: string) => (
    <Button type="secondary" className="btn-polices">
      {' '}
      {item}
    </Button>
  ));

  return (
    <Card>
      <div className="card-content">
        <div className="title">{appName}</div>
        <div className="deployment">{status}</div>
      </div>
      <div className="padding-left-15">
        {' '}
        {APP_POLICIES}:{appPolicy}
      </div>
    </Card>
  );
}
