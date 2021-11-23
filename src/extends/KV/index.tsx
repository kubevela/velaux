import React, { Component } from 'react';
import { Grid, Button, Icon, Form, Input, Radio } from '@b-design/ui';
import _ from 'lodash';

const { Row, Col } = Grid;

type Props = {
  value?: object;
  onChange?: (value: any) => void;
  id: string;
};

type State = {
  items: Array<Item>;
};

type Item = {
  key: string;
  value?: any;
};

function getEmptyItem() {
  return {
    key: '',
    value: '',
  };
}

class KV extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { value } = props;
    const items = [];
    if (value) {
      for (const key in value) {
        items.push({ key: key, value: value[key] });
      }
    }
    this.state = {
      items,
    };
  }

  addItem() {
    const { items } = this.state;
    items.push(getEmptyItem());
    this.setState({ items: [...items] });
  }

  onItemChanged(index: number, field: any, v: any) {
    const { items } = this.state;
    if (field == 'key') {
      items[index].key = v;
    }
    if (field == 'value') {
      items[index].value = v;
    }
    let obj = Object.create(null);
    items.map((item) => {
      if (item.key) {
        obj[item.key] = item.value;
      }
    });

    this.submit(obj);
  }

  submit(items: any) {
    const { onChange } = this.props;
    if (onChange) {
      onChange(items);
    }
  }

  remove(index: any) {
    const { items } = this.state;
    items.splice(index, 1);
    this.setState({ items: [...items] });
    this.submit([...items]);
  }

  render() {
    const { items } = this.state;
    return (
      <div>
        {items.map((item, index) => {
          return (
            <Row key={index} gutter="20">
              <Col span={10}>
                <Form.Item required>
                  <Input
                    name={`envKey${index}`}
                    label={'Key'}
                    className="full-width"
                    value={item.key}
                    onChange={(value) => this.onItemChanged(index, 'key', value)}
                    placeholder={''}
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item>
                  <Input
                    name={`envValue${index}`}
                    label={'Value'}
                    className="full-width"
                    value={item.value}
                    onChange={(value) => this.onItemChanged(index, 'value', value)}
                    placeholder={''}
                  />
                </Form.Item>
              </Col>
              <Col span={1}>
                <div className="mt-5" style={{ padding: '8px 0' }}>
                  <Icon type="ashbin" size="small" onClick={() => this.remove(index)} />
                </div>
              </Col>
            </Row>
          );
        })}
        <div className="mb-20 flexright">
          <Button size="small" type="secondary" onClick={this.addItem.bind(this)}>
            Add
          </Button>
        </div>
      </div>
    );
  }
}

export default KV;
