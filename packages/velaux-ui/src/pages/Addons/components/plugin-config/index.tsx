import React from 'react';
import './index.less';
import type { PluginMeta } from '@velaux/data';
import { AppConfigPage } from "@velaux/ui/src/layout/AppRootPage";

type State = {};

type Props = {
  plugin: PluginMeta
};


class PluginConfig extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    const { plugin } = this.props;
    return (
      <div className="plugin-config">
        <AppConfigPage pluginId={plugin.id}></AppConfigPage>;
      </div>
    )
  }

}

export default PluginConfig;
