import React, { Component } from 'react';
import { Grid, Button, Icon, Form, Input, Field } from '@b-design/ui';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import type { UIParam } from '../../interface/application';

const { Row, Col } = Grid;

type Props = {
  value?: any;
  onChange?: (value: any) => void;
  additional?: boolean;
  additionalParameter?: UIParam;
  subParameters?: UIParam[];
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
      onChange: () => {
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
    const { id, additional, additionalParameter } = this.props;
    const { init } = this.form;
    let valueTypeNumber = false;
    if (additional && additionalParameter) {
      // TODO: current only support one parameter
      valueTypeNumber = additionalParameter.uiType == 'Number';
    }
    return (
      <div id={id}>
        {items.map((item) => {
          return (
            <Row key={item.key} gutter="20">
              <Col span={10}>
                <Form.Item>
                  <Input
                    disabled={this.props.disabled}
                    {...init(`envKey-${item.key}`)}
                    label={'Key'}
                    className="full-width"
                    placeholder={''}
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item>
                  <Input
                    disabled={this.props.disabled}
                    htmlType={valueTypeNumber ? 'number' : ''}
                    {...init(`envValue-${item.key}`)}
                    label={'Value'}
                    className="full-width"
                    placeholder={''}
                  />
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
