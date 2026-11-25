import { connect } from 'dva';
import _ from 'lodash';
import React, { Component, Fragment } from 'react';

import { detailDefinition } from '../../api/definitions';
import { PageHeader } from '../../components/PageHeader';
import { PageTab, PageTabs } from '../../components/PageTabs';
import { StatusBadge } from '../../components/StatusBadge';
import { definitionPlaceFrom, definitionPlaceQuery } from '../../utils/definitionPlace';
import type { DefinitionBase, DefinitionMenuType, LoginUserInfo } from '@velaux/data';

type Props = {
  activeId: string;
  location: { search: string };
  match: {
    params: {
      definitionName: string;
      definitionType: string;
    };
  };
  dispatch: ({}) => {};
  userInfo?: LoginUserInfo;
  definitionTypes: DefinitionMenuType[];
};

// typeNames names one definition of each type.
const typeNames: Record<string, string> = {
  component: 'Component',
  trait: 'Trait',
  policy: 'Policy',
  workflowstep: 'Workflow Step',
  source: 'Source',
};

type State = {
  definition?: DefinitionBase;
};

@connect((store: any) => {
  return { ...store.definitions, ...store.user };
})
class DefinitionDetailsLayout extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.loadDefinition();
  }

  componentDidUpdate(prev: Props) {
    const { definitionName, definitionType } = this.props.match.params;
    if (
      prev.match.params.definitionName !== definitionName ||
      prev.match.params.definitionType !== definitionType ||
      prev.location.search !== this.props.location.search
    ) {
      this.loadDefinition();
    }
  }

  loadDefinition = () => {
    const { definitionName, definitionType } = this.props.match.params;
    this.setState({ definition: undefined });
    detailDefinition({
      ...definitionPlaceFrom(this.props.location.search),
      name: definitionName,
      type: definitionType,
    }).then((res: any) => {
      if (res && res.name === this.props.match.params.definitionName) {
        this.setState({ definition: res });
      }
    });
  };

  getNavList = () => {
    const { params = { definitionType: '', definitionName: '' } } = this.props.match;
    const { definitionType, definitionName } = params;
    const query = definitionPlaceQuery(definitionPlaceFrom(this.props.location.search));
    return [
      { id: 'doc', name: 'Documentation', to: `/definitions/${definitionType}/${definitionName}/doc${query}` },
      { id: 'file', name: 'CUE Source', to: `/definitions/${definitionType}/${definitionName}/file${query}` },
      { id: 'uiSchema', name: 'UI Schema', to: `/definitions/${definitionType}/${definitionName}/ui-schema${query}` },
    ];
  };

  render() {
    const { params = { definitionType: '', definitionName: '' } } = this.props.match;
    const { definitionType, definitionName } = params;
    const { definition } = this.state;
    const where = definition?.scope || definitionPlaceFrom(this.props.location.search).where;
    const typeName = typeNames[definitionType] || _.upperFirst(definitionType);
    return (
      <Fragment>
        <PageHeader
          breadcrumb={[
            { to: `/definitions/${definitionType}/config`, title: 'Definitions' },
            { title: definitionName },
          ]}
          title={definition?.alias || definitionName}
          description={definition?.description}
        >
          {definition?.alias && <span className="page-head-meta">{definitionName}</span>}
          {typeName && <StatusBadge tone="neutral" label={typeName} />}
          {where && (
            <StatusBadge
              tone={where === 'project' ? 'progressing' : 'neutral'}
              label={where === 'project' ? 'Project' : 'Global'}
            />
          )}
          {definition?.status && (
            <StatusBadge
              tone={definition.status === 'enable' ? 'healthy' : 'neutral'}
              label={definition.status === 'enable' ? 'Enabled' : 'Disabled'}
            />
          )}
        </PageHeader>
        <PageTabs>
          {this.getNavList().map((item) => (
            <PageTab key={item.id} label={item.name} to={item.to} active={this.props.activeId === item.id} />
          ))}
        </PageTabs>
        {this.props.children}
      </Fragment>
    );
  }
}

export default DefinitionDetailsLayout;
