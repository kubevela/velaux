import React, { Fragment } from 'react';
import './index.less';

import { Menu, Dialog } from '@alifd/next';

import kubernetesSvg from '../../../../assets/kubernetes.svg';
import { Chip, ResourceCard, ResourceGrid } from '../../../../components/ResourceCard';
import { Translation } from '../../../../components/Translation';
import type { Cluster, LoginUserInfo } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { momentDate } from '../../../../utils/common';
import { checkPermission } from '../../../../utils/permission';

import { connect } from 'dva';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clusters: [];
  userInfo?: LoginUserInfo;
  editCluster: (name: string) => void;
  deleteCluster: (name: string) => void;
};

@connect((store: any) => {
  return { ...store.user };
})
class CardContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }
  editCluster = (name: string) => {
    this.props.editCluster(name);
  };
  onDeleteCluster = (name: string) => {
    this.props.deleteCluster(name);
  };

  isEditPermission = (item: Cluster) => {
    const { userInfo } = this.props;
    const project = '';
    const request = { resource: `cluster:${item.name}`, action: 'update' };
    if (checkPermission(request, project, userInfo)) {
      return (
        <Menu.Item
          onClick={() => {
            this.editCluster(item.name);
          }}
        >
          <Translation>Edit</Translation>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };

  isDeletePermission = (item: Cluster) => {
    const { userInfo } = this.props;
    const project = '';
    const request = { resource: `cluster:${item.name}`, action: 'delete' };
    if (checkPermission(request, project, userInfo)) {
      return (
        <Menu.Item
          onClick={() => {
            Dialog.confirm({
              type: 'confirm',
              content: <Translation>Are you sure you want the detach cluster?</Translation>,
              onOk: () => {
                this.onDeleteCluster(item.name);
              },
              locale: locale().Dialog,
            });
          }}
        >
          <Translation>Detach</Translation>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };
  render() {
    const { clusters } = this.props;
    return (
      <ResourceGrid>
        {clusters.map((item: Cluster) => {
          const { name, alias, status, icon, description, createTime, dashboardURL, providerInfo } = item;
          const tone = status === 'Healthy' ? 'healthy' : status === 'Unhealthy' ? 'unhealthy' : 'neutral';
          const title = dashboardURL ? (
            <a title={name} target="_blank" href={dashboardURL} rel="noopener noreferrer">
              {alias || name}
            </a>
          ) : (
            alias || name
          );
          return (
            <ResourceCard
              key={name}
              tone={tone}
              badge={status === 'Unhealthy' ? 'UnHealthy' : status || 'Unknown'}
              icon={<img src={icon && icon !== 'none' ? icon : kubernetesSvg} />}
              title={title}
              subtitle={alias && alias !== name ? name : undefined}
              menu={
                name !== 'local' ? (
                  <Menu>
                    {this.isEditPermission(item)}
                    {this.isDeletePermission(item)}
                  </Menu>
                ) : undefined
              }
              aside={
                <span className="resource-chip">
                  <Translation>Local</Translation>
                </span>
              }
              description={description}
              chips={
                providerInfo?.provider ? (
                  <Fragment>
                    <Chip>{providerInfo.provider}</Chip>
                    {providerInfo.regionID && <Chip>{providerInfo.regionID}</Chip>}
                  </Fragment>
                ) : undefined
              }
              footLeft={createTime && momentDate(createTime)}
            />
          );
        })}
      </ResourceGrid>
    );
  }
}

export default CardContent;
