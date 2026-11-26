import { Loading, Message } from '@alifd/next';
import type { DefinitionFormContext, DefinitionKind } from '@velaux/data';
import React, { Component } from 'react';

import { getPluginSrv } from '../../services/PluginService';
import { definitionKind, pluginValidation } from '../../utils/definitionPlugin';
import type { DefinitionPluginLookup, PropertiesValidator } from '../../utils/definitionPlugin';
import { ErrorBoundary } from '../ErrorBoundary';
import i18n from 'i18next';
import UISchema from '../UISchema';
import type { UISchemaProps } from '../UISchema';

type Props = UISchemaProps & {
  // context tells a plugin form where it is being filled in.
  context?: DefinitionFormContext;
};

type State = {
  lookup?: DefinitionPluginLookup;
  // lookupKey is the kind/name the lookup belongs to.
  lookupKey?: string;
};

// DefinitionPropertiesForm renders the properties form of a definition: the
// form of the definition plugin that lists it, if one is enabled, otherwise the
// generated UISchema form. The coding mode always uses the UISchema editor, and
// a plugin that fails to load or render falls back to it with a notice.
class DefinitionPropertiesForm extends Component<Props, State> implements PropertiesValidator {
  uiSchemaRef: React.RefObject<UISchema>;

  constructor(props: Props) {
    super(props);
    this.state = {};
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    this.lookup();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.key(prevProps) !== this.key(this.props)) {
      this.lookup();
    }
  }

  key = (props: Props): string | undefined => {
    const kind = definitionKind(props.definition?.type);
    const name = props.definition?.name;
    return kind && name ? `${kind}/${name}` : undefined;
  };

  lookup = () => {
    const key = this.key(this.props);
    if (!key) {
      this.setState({ lookup: { status: 'none' }, lookupKey: undefined });
      return;
    }
    const [kind, name] = key.split('/') as [DefinitionKind, string];
    this.setState({ lookup: undefined, lookupKey: key });
    getPluginSrv()
      .findDefinitionPlugin(kind, name)
      .then((lookup) => {
        if (this.key(this.props) === key) {
          this.setState({ lookup, lookupKey: key });
        }
      });
  };

  // validate reports the plugin's own message when a plugin form is showing,
  // otherwise the generic message when the generated form fails.
  validate = (callback: (error?: string) => void, generic?: string) => {
    const check = pluginValidation(this.state.lookup, !!this.props.enableCodeEdit, this.props.value);
    if (check.applies) {
      callback(check.error);
      return;
    }
    if (!this.uiSchemaRef.current) {
      callback();
      return;
    }
    this.uiSchemaRef.current.validate((error?: string) => callback(error ? generic || error : undefined));
  };

  renderGeneric(notice?: string) {
    const { context, ...rest } = this.props;
    return (
      <div>
        {notice && (
          <Message type="warning" style={{ marginBottom: 8 }}>
            {notice}
          </Message>
        )}
        <UISchema {...rest} ref={this.uiSchemaRef} />
      </div>
    );
  }

  render() {
    const { lookup } = this.state;
    const { enableCodeEdit, definition, value, onChange, onValidityChange, context } = this.props;
    if (enableCodeEdit || lookup?.status === 'none') {
      return this.renderGeneric();
    }
    if (!lookup) {
      return <Loading visible={true} style={{ width: '100%', minHeight: 80 }} />;
    }
    if (lookup.status === 'failed') {
      return this.renderGeneric(
        i18n.t('The form plugin could not be loaded, showing the standard form.') + ` (${lookup.pluginID})`
      );
    }
    const PluginForm = lookup.plugin.form!;
    const kind = definitionKind(definition?.type)!;
    return (
      <ErrorBoundary dependencies={[lookup.plugin.meta.id]}>
        {({ error }) => {
          if (error) {
            return this.renderGeneric(
              i18n.t('The form plugin failed, showing the standard form.') + ` (${lookup.plugin.meta.id})`
            );
          }
          return (
            <PluginForm
              value={value}
              onChange={(v: any) => {
                if (onChange) {
                  onChange(v);
                }
                if (onValidityChange) {
                  onValidityChange(!lookup.plugin.validator || !lookup.plugin.validator(v));
                }
              }}
              definition={{ kind, name: definition?.name || '', description: definition?.description }}
              context={context || {}}
            />
          );
        }}
      </ErrorBoundary>
    );
  }
}

export default DefinitionPropertiesForm;
