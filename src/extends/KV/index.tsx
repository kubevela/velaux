import React, { Component } from 'react';
import { Grid, Button, Icon, Form, Input, Field, Select } from '@b-design/ui';
import type { Rule } from '@alifd/field';
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
  inputValue?: string;
};

type Item = {
  key: string;
  label: string;
  value?: any;
  valueType: any;
};

class KV extends Component<Props, State> {
  form: Field;
  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
    };
    this.form = new Field(this, {
      onChange: (name: string, value: string) => {
        const { keyOptions } = this.props;
        if (keyOptions && name.indexOf('envKey-') > -1) {
          const itemKey = name.substring(name.indexOf('-') + 1);
          this.form.setValue('envValue-' + itemKey, keyOptions[value]);
          const { items } = this.state;
          const newItems = items.map((item) => {
            if (item.key == itemKey) {
              item.value = keyOptions[value];
              item.valueType = this.getValueType(keyOptions[value]);
            }
            return item;
          });
          this.setState({ items: newItems });
        }
        this.submit();
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
        newItems.push({
          key: key,
          label: label,
          value: value[label],
          valueType: this.getValueType(value[label]),
        });
        this.form.setValue('envKey-' + key, label);
        this.form.setValue('envValue-' + key, value[label]);
        this.form.setValue('envType-' + key, this.getValueType(value[label]))
      }
    }

    this.setState({ items: newItems });
  };

  addItem() {
    const { items } = this.state;
    items.push({
      key: Date.now().toString(),
      label: '',
      value: '',
      valueType: this.getValueType(''),
    });
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
          item = { key: '', label: '', valueType: 'string' };
        }
        item.key = index
        item.label = values[key];
        items.set(index, item);
      }

      if (key.startsWith('envValue-')) {
        const index = key.replace('envValue-', '');
        let item = items.get(index);
        if (!item) {
          item = { key: '', label: '', valueType: 'string', };
        }
        item.value = values[key];
        items.set(index, item);
      }
      if (key.startsWith('envType-')) {
        const index = key.replace('envType-', '');
        let item = items.get(index);
        if (!item) {
          item = { key: '', label: '', valueType: '' };
        }
        item.valueType = values[key];
        if (item.value == undefined) {
          item.value = values['envValue-' + index]
        }
        if (this.getValueType(item.value) !== item.valueType && item.valueType !== 'object') {
          item.value = item.valueType == 'boolean' ? true : ''
        }
        items.set(index, item);
      }
    });
    const obj = Object.create(null);
    const newItems: Item[] = []
    items.forEach((item: Item) => {
      obj[item.label] = item.value;
      newItems.push(item)
    });
    this.setState({ items: newItems });
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
    this.form.remove('envType-' + key);
    this.setState({ items: items });
    this.submit();
  }

  onSearch = (value: string) => {
    this.setState({ inputValue: value });
  };

  getValueType = (value: any) => {
    const findValueType = this.matchOutSideValueType();
    const valueTypeAdditionalParam = ['number', 'boolean', 'object'];
    if (valueTypeAdditionalParam.includes(findValueType)) {
      return findValueType;
    } else {
      if (value != undefined) {
        return typeof value;
      } else {
        return 'string';
      }
    }
  };

  matchOutSideValueType = () => {
    const { additional, additionalParameter } = this.props;
    const outSideValueType = [
      { uiType: 'Number', valueType: 'number' },
      { uiType: 'Switch', valueType: 'boolean' },
    ];
    if (additional && additionalParameter && additionalParameter.uiType) {
      const matchValueTypeObj = _.find(outSideValueType, (item) => {
        return item.uiType === additionalParameter.uiType;
      });
      return (matchValueTypeObj && matchValueTypeObj.valueType) || 'string';
    } else {
      return 'string';
    }
  };

  render() {
    const { items, inputValue } = this.state;
    const { id, keyOptions } = this.props;
    const { init } = this.form;
    const dataSource = keyOptions ? Object.keys(keyOptions) : [];
    if (inputValue) {
      dataSource.push(inputValue);
    }
    const options = [{ label: 'string', value: 'string' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }, { label: 'object', value: 'object' }]
    const checkObjectFormat = (rule: Rule, value: any, callback: (error?: string) => void) => {
      if (value == undefined) {
        callback()
        return
      }
      if (isNaN(Number(value))) {
        try {
          if (typeof JSON.parse(value) == "object") {
            callback()
          }
        } catch {
          callback('Wrong format')
        }
      }
      callback('Wrong format')
    }

    return (
      
        <div id={id}>
          {items.map((item) => {
            return (
              <Form field={this.form}>
                <Row key={item.key} gutter="20">
                  <Col span={8}>
                    <Form.Item>
                      <If condition={dataSource && dataSource.length > 0}>
                        <Select
                          showSearch={true}
                          dataSource={[{ label: 'On Webhook Event', value: 'webhook' }]}
                          disabled={this.props.disabled}
                          {...init(`envKey-${item.key}`)}
                          label={'Key'}
                          placeholder={i18n.t('Please select')}
                          locale={locale().Select}
                          onSearch={this.onSearch}
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
                  <Col span={6}>
                    <Form.Item>
                      <Select
                        showSearch={true}
                        dataSource={options}
                        {...init(`envType-${item.key}`)}
                        label={'Type'}
                        placeholder={i18n.t('Please select')}
                        locale={locale().Select}
                        onSearch={this.onSearch}
                        value={item.valueType}
                        onChange={(v) => {
                          this.form.setValue('envType-' + item.key, v)
                          item.valueType = v
                          if (v == 'boolean') {
                            this.form.setValue('envValue-' + item.key, true)
                            item.value = true
                          } else {
                            this.form.setValue('envValue-' + item.key, '')
                            item.value = ''
                          }
                          this.setState({ items: items });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={9}>
                    <Form.Item>
                      <If condition={item.valueType == 'number' || item.valueType == 'string'}>
                        <Input
                          disabled={this.props.disabled}
                          htmlType={item.valueType == 'number' ? 'number' : ''}
                          {...init(`envValue-${item.key}`)}
                          value={item.value}
                          label={'Value'}
                          className="full-width"
                          placeholder={i18n.t(
                            item.valueType == 'number'
                              ? 'Please input a number'
                              : 'Please input a value',
                          )}
                        />
                      </If>
                      <If condition={item.valueType == 'object'}>
                        <Input
                          name={`envValue-${item.key}`}
                          disabled={this.props.disabled}
                          label={'Value'}
                          className="full-width"
                          placeholder={i18n.t('Please input a object')}
                          {...init(`envValue-${item.key}`, {
                            rules: [
                              {
                                validator: checkObjectFormat,
                                message: 'Wrong format.',
                              },
                            ],
                          })}
                          value={item.value}
                        />
                      </If>
                      <If condition={item.valueType == 'boolean'}>
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
              </Form>
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
