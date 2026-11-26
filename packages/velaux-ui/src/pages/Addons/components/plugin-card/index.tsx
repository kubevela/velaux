import { Button } from '@alifd/next';
import type { Addon } from '@velaux/data';
import React from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';
import { HiOutlineExternalLink } from 'react-icons/hi';

import { Chip, ResourceCard } from '../../../../components/ResourceCard';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import './index.less';

type Props = {
  id: string;
  enabled?: boolean;
  installed?: boolean;
  icon?: string;
  description?: string;
  sourceAddon?: Addon;
  url?: string;
  tags: string[];
  history?: {
    push: (path: string, state?: any) => void;
    location: {
      pathname: string;
    };
  };
  onInstall: (id: string, url: string) => void;
};

// PluginIcon is the plugin's logo, or a plain icon when it has none or it fails to load.
const PluginIcon = (props: { src?: string }) => {
  const [failed, setFailed] = React.useState(false);
  const url = props.src && props.src !== 'null' ? (props.src.startsWith('/') ? props.src : '/' + props.src) : '';
  return url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : <AiOutlineAppstore />;
};

// PluginCard is one VelaUX plugin: its status, description, tags and the way in.
const PluginCard = (props: Props) => {
  const { id, icon, description, sourceAddon, enabled, installed, url } = props;
  const tags = [...(props.tags || []), ...(sourceAddon?.tags ?? [])];
  if (sourceAddon) {
    tags.unshift(`from: ${sourceAddon.name}`);
  }
  const openConfig = installed ? () => props.history?.push(`/manage/plugins/${id}/config`) : undefined;
  return (
    <ResourceCard
      tone={enabled ? 'healthy' : installed ? 'neutral' : undefined}
      badge={enabled ? 'Enabled' : installed ? 'Installed' : undefined}
      icon={<PluginIcon src={icon} />}
      title={id}
      onOpen={openConfig}
      aside={
        enabled ? (
          <a
            className="plugin-card-open"
            title={i18n.t('Open').toString()}
            onClick={() => props.history?.push(`/plugins/${id}`)}
          >
            <HiOutlineExternalLink />
          </a>
        ) : undefined
      }
      description={description ?? sourceAddon?.description ?? i18n.t('No descriptions').toString()}
      chips={
        tags.length > 0 ? (
          <>
            {tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </>
        ) : undefined
      }
      footRight={
        url && !installed ? (
          <Button size="small" type="primary" onClick={() => props.onInstall(id, url)}>
            <Translation>Install</Translation>
          </Button>
        ) : undefined
      }
    />
  );
};

export default PluginCard;
