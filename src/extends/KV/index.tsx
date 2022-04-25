import React, { Component } from 'react';
import { Grid, Button, Icon, Form, Input, Field, Select } from '@b-design/ui';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import type { UIParam } from '../../interface/application';
import { If } from 'tsx-control-statements/components';
import { Switch } from '@alifd/meet-react';
import i18n from '../../i18n';
import locale from '../../utils/locale';

const { Row, Col } = Grid;

type Props = {
  value?: any;
  onChange?: (value: any) => void;
  additional?: boolean;
  additionalParameter?: UIParam;
  subParameters?: UIParam[];
  keyOptions?: any;
  id: string;
  disabled: boolean;
};

type State = {
  items: Item[];
};

type Item = {
  key: string;
  label: string;
  value?: any;
};

function getEmptyItem() {
  return {
    key: Date.now().toString(),
    label: '',
    value: '',
  };
}

class KV extends Component<Props, State> {
  form: Field;
  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
    };
    this.form = new Field(this, {
      onChange: (name: string, value: string) => {
        this.submit();
        const { keyOptions } = this.props;
        if (keyOptions && name.indexOf('envKey-') > -1) {
          const itemKey = name.substring(name.indexOf('-') + 1);
          this.form.setValue('envValue-' + itemKey, keyOptions[value]);
          const { items } = this.state;
          const newItems = items.map((item) => {
            if (item.key == itemKey) {
              item.value = keyOptions[value];
            }
            return item;
          });
          this.setState({ items: newItems });
        }
      },
    });
  }

  componentDidMount() {
    this.setValues();
  }

  setValues = () => {
    const { value } = this.props;
    const { items } = this.state;
    const newItems = [...items];
    if (value) {
      for (const label in value) {
        const key = Date.now().toString() + label;
        newItems.push({ key: key, label: label, value: value[label] });
        this.form.setValue('envKey-' + key, label);
        this.form.setValue('envValue-' + key, value[label]);
      }
    }
    this.setState({ items: newItems });
  };

  addItem() {
    const { items } = this.state;
    items.push(getEmptyItem());
    this.setState({ items: [...items] });
  }

  submit() {
    const values: any = this.form.getValues();
    const items: Map<string, Item> = new Map();
    Object.keys(values).map((key) => {
      if (key.startsWith('envKey-')) {
        const index = key.replace('envKey-', '');
        let item = items.get(index);
        if (!item) {
          item = { key: '', label: '' };
        }
        item.label = values[key];
        items.set(index, item);
      }

      if (key.startsWith('envValue-')) {
        const index = key.replace('envValue-', '');
        let item = items.get(index);
        if (!item) {
          item = { key: '', label: '' };
        }
        item.value = values[key];
        items.set(index, item);
      }
    });
    const obj = Object.create(null);
    items.forEach((item: Item) => {
      obj[item.label] = item.value;
    });
    const { onChange } = this.props;
    if (onChange) {
      onChange(obj);
    }
  }

  remove(key: any) {
    const { items } = this.state;
    items.forEach((item, i) => {
      if (item.key === key) {
        items.splice(i, 1);
      }
    });
    this.form.remove('envKey-' + key);
    this.form.remove('envValue-' + key);
    this.setState({ items: items });
    this.submit();
  }

  render() {
    const { items } = this.state;
    const { id, additional, additionalParameter, keyOptions } = this.props;
    const { init } = this.form;
    let valueType = 'string';
    if (additional && additionalParameter) {
      // TODO: current only support one parameter
      if (additionalParameter.uiType == 'Number') {
        valueType = 'number';
      }
      if (additionalParameter.uiType == 'Switch') {
        valueType = 'boolean';
      }
    }
    const dataSource = keyOptions ? Object.keys(keyOptions) : [];
    return (
      <div id={id}>
        {items.map((item) => {
          if (item.value != undefined && valueType == 'string') {
            valueType = typeof item.value;
          }
          return (
            <Row key={item.key} gutter="20">
              <Col span={10}>
                <Form.Item>
                  <If condition={dataSource && dataSource.length > 0}>
                    <Select
                      showSearch={true}
                      dataSource={dataSource}
                      disabled={this.props.disabled}
                      {...init(`envKey-${item.key}`)}
                      label={'Key'}
                      placeholder={i18n.t('Please select')}
                      locale={locale().Select}
                    />
                  </If>
                  <If condition={!keyOptions}>
                    <Input
                      disabled={this.props.disabled}
                      {...init(`envKey-${item.key}`)}
                      label={'Key'}
                      className="full-width"
                      placeholder={''}
                    />
                  </If>
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item>
                  <If condition={valueType == 'number' || valueType == 'string'}>
                    <Input
                      disabled={this.props.disabled}
                      htmlType={valueType == 'number' ? 'number' : ''}
                      {...init(`envValue-${item.key}`)}
                      label={'Value'}
                      className="full-width"
                      placeholder={i18n.t('Please input or select key')}
                    />
                  </If>
                  <If condition={valueType == 'boolean'}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ lineHeight: '36px', marginRight: '16px' }}>Value:</span>
                      <Switch
                        checked={this.form.getValue(`envValue-${item.key}`)}
                        disabled={this.props.disabled}
                        {...init(`envValue-${item.key}`)}
                        className="full-width"
                      />
                    </div>
                  </If>
                </Form.Item>
              </Col>
              <Col span={1}>
                <div className="mt-5" style={{ padding: '8px 0' }}>
                  <Icon type="ashbin" size="small" onClick={() => this.remove(item.key)} />
                </div>
              </Col>
            </Row>
          );
        })}
        <div className="mb-20 flexright">
          <Button
            disabled={this.props.disabled}
            size="small"
            type="secondary"
            onClick={this.addItem.bind(this)}
          >
            Add
          </Button>
        </div>
      </div>
    );
  }
}

export default KV;
