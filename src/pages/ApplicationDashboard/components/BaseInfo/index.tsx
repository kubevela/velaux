import React from 'react';
import { Card, Button } from '@b-design/ui';
import { POLICIES } from '../../constants';
import { ApplicationDetail } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';

type Props = {
  detail: ApplicationDetail;
  policies?: Array<string>;
};

export default function BaseInfo(props: Props) {
  const { detail, policies } = props;
  const appPolicy = (policies || []).map((item: string) => (
    <Button key={item} type="secondary" className="btn-polices">
      <Translation>{'policy-' + item}</Translation>
    </Button>
  ));

  return <Card></Card>;
}
