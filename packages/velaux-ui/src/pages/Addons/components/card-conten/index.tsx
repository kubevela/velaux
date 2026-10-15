import type { MouseEvent } from 'react';
import React, { Fragment } from 'react';
import './index.less';

import { Balloon } from '@alifd/next';

import Empty from '../../../../components/Empty';
import { Chip, ResourceCard, ResourceGrid } from '../../../../components/ResourceCard';
import type { Tone } from '../../../../components/StatusBadge';
import { If } from '../../../../components/If';
import type { Addon, AddonBaseStatus } from '@velaux/data';
import { intersectionArray } from '../../../../utils/common';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clickAddon: (name: string) => void;
  addonLists: Addon[];
  enabledAddons?: AddonBaseStatus[];
  selectTags: string[];
};

class CardContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }

  handleClick = (index: number, e: MouseEvent) => {
    e.preventDefault();
    const { extendDotVisible } = this.state;
    this.setState({
      extendDotVisible: !extendDotVisible,
      choseIndex: index,
    });
  };

  render() {
    const { addonLists, clickAddon, enabledAddons, selectTags } = this.props;

    const nameUpper = (name: string) => {
      return name
        .split('-')
        .map((sep) => {
          if (sep.length > 0) {
            return sep.toUpperCase()[0];
          }
          return sep;
        })
        .toString()
        .replace(',', '');
    };
    const orderAddonList: Addon[] = [];
    addonLists.map((addon) => {
      const status = enabledAddons?.filter((addonStatus: AddonBaseStatus) => {
        return addonStatus.name == addon.name;
      });
      if (selectTags.length > 0 && !intersectionArray(addon.tags, selectTags)?.length) {
        return;
      }
      if (status && status.length > 0 && status[0].phase == 'enabled') {
        orderAddonList.unshift(addon);
      } else {
        orderAddonList.push(addon);
      }
    });
    const notice = "This addon is experimental, please don't use it in production";
    return (
      <div>
        <If condition={addonLists}>
          <ResourceGrid>
            {orderAddonList.map((item: Addon) => {
              const { name, icon, version, description, tags, registryName } = item;
              const phase = enabledAddons?.find((addonStatus: AddonBaseStatus) => addonStatus.name == name)?.phase;
              return (
                <ResourceCard
                  key={name}
                  tone={addonTone(phase)}
                  badge={addonLabel(phase)}
                  icon={<AddonIcon icon={icon} initials={nameUpper(name)} />}
                  title={name}
                  onOpen={() => clickAddon(name)}
                  aside={
                    registryName == 'experimental' ? (
                      <Balloon trigger={<span className="resource-chip warning">Experimental</span>}>{notice}</Balloon>
                    ) : undefined
                  }
                  description={description}
                  chips={
                    tags && tags.length > 0 ? (
                      <Fragment>
                        {tags.map((tag: string) => (
                          <Chip key={tag} tone={tag === 'GA' ? 'accent' : undefined}>
                            {tag}
                          </Chip>
                        ))}
                      </Fragment>
                    ) : undefined
                  }
                  footLeft={(version || '0.0.0').replace(/^v?/, 'v')}
                  footRight={registryName}
                />
              );
            })}
          </ResourceGrid>
        </If>
        <If condition={!addonLists || addonLists.length == 0}>
          <Empty style={{ minHeight: '400px' }} />
        </If>
      </div>
    );
  }
}

// AddonIcon is the addon's icon, or its initials where it has none or the
// icon fails to load.
const AddonIcon = (props: { icon?: string; initials: string }) => {
  const [failed, setFailed] = React.useState(false);
  if (!props.icon || props.icon === 'none' || failed) {
    return <Fragment>{props.initials}</Fragment>;
  }
  return <img src={props.icon} onError={() => setFailed(true)} />;
};

// addonTone colours an addon by its phase; one never enabled is neutral.
function addonTone(phase?: string): Tone {
  switch (phase) {
    case 'enabled':
      return 'healthy';
    case 'enabling':
    case 'disabling':
      return 'progressing';
    case 'suspend':
      return 'suspended';
    default:
      return 'neutral';
  }
}

function addonLabel(phase?: string): string {
  switch (phase) {
    case 'enabled':
      return 'Enabled';
    case 'enabling':
      return 'Enabling';
    case 'disabling':
      return 'Disabling';
    case 'suspend':
      return 'Suspended';
    default:
      return 'Not enabled';
  }
}

export default CardContent;
