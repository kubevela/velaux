import React from 'react';
import { Card, Button } from '@b-design/ui';
import { POLICIES } from '../../constants';
import { AppPlanDetail } from '../../../../interface/applicationplan';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';

type Props = {
  detail: AppPlanDetail;
  policies?: Array<string>;
};

export default function BaseInfo(props: Props) {
  const { detail, policies } = props;
  const appPolicy = (policies || []).map((item: string) => (
    <Button type="secondary" className="btn-polices">
      {item}
    </Button>
  ));

  return (
    <Card>
      <div className="card-content">
        <div className="title">{detail.alias ? detail.alias : detail.name}</div>
        <div className="deployment">
          <If condition={detail.status == 'deployed'}>
            <span className="circle circle-success"></span>
            <Translation>Deployed</Translation>
          </If>
          <If condition={!detail.status || detail.status == 'undeploy'}>
            <span className="circle"></span>
            <Translation>UnDeploy</Translation>
          </If>
          <If condition={detail.status == 'warning'}>
            <span className="circle circle-warning"></span>
            <Translation>Warning</Translation>
          </If>
        </div>
      </div>
      <div className="padding-left-15">
        {POLICIES}:{appPolicy}
      </div>
    </Card>
  );
}
