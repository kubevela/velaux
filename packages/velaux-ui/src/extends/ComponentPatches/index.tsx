import type { Rule } from '@alifd/next/lib/field';
import { Field } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';

import { getApplicationComponents } from '../../api/application';
import type { ApplicationComponentBase } from '@velaux/data';

import type { ComponentPatchData } from './component-patch';
import ComponentPatch from './component-patch';

type Props = {
  value?: ComponentPatchData[];
  id: string;
  onChange: (value: ComponentPatchData[]) => void;
  registerForm: (form: Field) => void;
  disabled: boolean;
  appName?: string;
  projectName?: string;
};

type State = {
  componentOptions: Array<{ label: string; value: string }>;
  componentTypeOptions: Array<{ label: string; value: string }>;
  componentPatches: ComponentPatchData[];
  components: ApplicationComponentBase[];
};

@connect((store: any) => {
  return { ...store.uischema };
})
class ComponentPatches extends React.Component<Props, State> {
  field: Field;
  registerForm: Record<string, Field>;
  constructor(props: Props) {
    super(props);
    this.state = {
      componentOptions: [],
      componentTypeOptions: [],
      componentPatches: [],
      components: [],
    };
    this.field = new Field(this, {
      onChange: () => {
        const values: Record<string, ComponentPatchData> = this.field.getValues();
        const data: ComponentPatchData[] = [];
        Object.keys(values).map((key) => {
          delete values[key].id;
          data.push(values[key]);
        });
        const { onChange } = this.props;
        if (onChange) {
          onChange(data);
        }
      },
    });
    this.props.registerForm(this.field);
    this.registerForm = {};
  }

  componentDidMount = () => {
    this.fetchComponentList();
  };

  fetchComponentList = async () => {
    const { appName } = this.props;
    if (appName) {
      getApplicationComponents({
        appName: appName,
      })
        .then((res) => {
          if (res && res.components) {
            const componentTypeOptions: Array<{ label: string; value: string }> = [];
            const componentOptions = (res.components || []).map(
              (item: ApplicationComponentBase) => {
                componentTypeOptions.push({
                  label: item.componentType,
                  value: item.componentType,
                });
                return {
                  label: `${item.name}(${item.alias || '-'})`,
                  value: item.name,
                };
              },
            );
            this.setState(
              {
                componentOptions: componentOptions,
                componentTypeOptions: componentTypeOptions,
                components: res.components,
              },
              () => {
                this.loadValue();
              },
            );
          } else {
            this.setState({
              componentOptions: [],
              componentTypeOptions: [],
              components: [],
            });
          }
        })
        .catch(() => {
          this.setState({
            componentOptions: [],
            componentTypeOptions: [],
            components: [],
          });
        });
    }
  };

  addPatch = () => {
    this.setState((prevState) => ({
      componentPatches: [...prevState.componentPatches, { id: uuid() }],
    }));
  };

  onRemove = (id: string) => {
    this.setState((prevState) => ({
      componentPatches: prevState.componentPatches.filter((cp) => cp.id != id) || [],
    }));
    this.field.remove(id);
  };

  onRegisterForm = (key: string, form: Field) => {
    this.registerForm[key] = form;
  };

  loadValue = () => {
    const { value } = this.props;
    if (Array.isArray(value)) {
      this.setState({
        componentPatches: value.map((v) => {
          return { ...v, id: uuid() };
        }),
      });
    }
  };

  render() {
    const { id, disabled, appName, projectName } = this.props;
    const { componentOptions, componentTypeOptions, componentPatches, components } = this.state;
    const { init } = this.field;
    return (
      <div id={id}>
        {!disabled && (
          <div className="flexright">
            <a onClick={this.addPatch}>
              <AiOutlinePlus /> Add a component patch
            </a>
          </div>
        )}
        {componentPatches.map((cp) => {
          if (!cp || !cp.id) {
            return;
          }
          const validator = (rule: Rule, v: any, callback: (error?: string) => void) => {
            if (cp.id && this.registerForm[cp.id]) {
              this.registerForm[cp.id].validate((errors: any) => {
                if (errors) {
                  callback(`The component patch ${cp?.name} validate failure`);
                  return;
                }
                callback();
              });
            } else {
              callback();
            }
          };
          return (
            <ComponentPatch
              key={cp.id}
              appName={appName || ''}
              projectName={projectName || ''}
              onRemove={this.onRemove}
              disabled={false}
              componentOptions={componentOptions}
              getComponents={(name?: string, type?: string) => {
                return components.filter((com) => {
                  return com.name == name || com.componentType == type;
                });
              }}
              {...init(cp.id, {
                initValue: cp,
                rules: [{ validator: validator }],
              })}
              componentTypeOptions={componentTypeOptions}
              registerForm={(form: Field) => {
                if (cp.id) {
                  this.onRegisterForm(cp.id, form);
                }
              }}
            />
          );
        })}
      </div>
    );
  }
}

export default ComponentPatches;
