import { Link } from 'dva/router';
import React, { useEffect, useState } from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';

import type { ApplicationBase } from '@velaux/data';
import { getApplicationList } from '../../../../api/application';
import Empty from '../../../../components/Empty';
import { RelativeTime } from '../../../../components/RelativeTime';
import '../../../../components/RowList';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import { healthLabels, healthOf } from '../../../ApplicationList/components/AppStatus/health';
import './index.less';

// addonLabel is the label naming the addon a synced application installs.
const addonLabel = 'ux.oam.dev/addon';

// AddonApplications lists the applications the enabled addons install, which
// the Services list leaves out.
export const AddonApplications = () => {
  const [apps, setApps] = useState<ApplicationBase[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getApplicationList({ addons: 'only', withStatus: true })
      .then((res: any) => setApps(res?.applications || []))
      .finally(() => setLoading(false));
  }, []);
  if (!loading && apps.length === 0) {
    return <Empty message={<Translation>No addon applications</Translation>} />;
  }
  return (
    <div className="row-list addon-app-list">
      <div className="row-list-head">
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Addon</Translation>
        </span>
        <span>
          <Translation>Status</Translation>
        </span>
        <span>
          <Translation>Components</Translation>
        </span>
        <span>
          <Translation>Updated</Translation>
        </span>
      </div>
      {apps.map((app) => {
        const health = healthOf(app.status);
        return (
          <div key={app.name} className="row-list-row">
            <div className="row-list-main">
              <Link className="row-list-name" to={`/applications/${app.name}/config`}>
                <AiOutlineAppstore className="row-list-icon" />
                <span className="row-list-title">{app.alias || app.name}</span>
              </Link>
              <span>{app.labels?.[addonLabel]}</span>
              <span>
                <StatusBadge tone={health} label={healthLabels[health]} />
              </span>
              <span>{app.status ? `${app.status.healthyComponents}/${app.status.components}` : '-'}</span>
              <span>
                <RelativeTime time={app.updateTime} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
