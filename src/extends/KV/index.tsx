import React, { Component } from 'react';
import { Grid, Button, Icon, Form, Input, Radio } from '@b-design/ui';
import _ from 'lodash';

const { Row, Col } = Grid;
const PREFER_JSON_MODE_ENV = 'PREFER_JSON_MODE_ENV';
const RadioGroup = Radio.Group;

type Props = {
  initValue?: any[];
  onChange?: Function;
  name?: string;
};

type State = {
  items: any[];
  jsonMode: boolean;
  jsonError: boolean;
  jsonContent: string;
};

function getEmptyItem() {
  return {
    key: '',
    value: '',
  };
}

function convertToJson(data: any) {
  const out: any = {};
  (data || []).forEach((item: any) => {
    const { key, value } = item;
    out[key] = value;
  });
  return JSON.stringify(out, null, 4);
}

function convertToItems(jsonContent: any) {
  let obj: any = {};

  try {
    obj = JSON.parse(jsonContent);
  } catch (e) {}

  return Object.keys(obj).map((key) => {
    return {
      key,
      value: obj[key],
    };
  });
}

class KV extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { initValue = [] } = props;

    this.state = {
      items: [...initValue],
      jsonMode: false,
      jsonContent: convertToJson(initValue),
      jsonError: false,
    };
  }

  addItem() {
    const { items } = this.state;
    items.push(getEmptyItem());
    this.setState({ items: [...items] });
  }

  onItemChanged(index: number, field: any, value: any) {
    const { items } = this.state;
    items[index][field] = value;
    this.setState({
      items: [...items],
    });
    this.submit(items);
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
    const { items, jsonMode } = this.state;
    return (
      <>
        <hr className="mb-20" />
        <div>
          {!jsonMode && (
            <>
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
                      <Form.Item required>
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
                      <div className="mt-5">
                        <Icon type="ashbin" size="small" onClick={() => this.remove(index)} />
                      </div>
                    </Col>
                  </Row>
                );
              })}
              <div className="mb-20">
                <Button type="secondary" onClick={this.addItem.bind(this)}>
                  <Icon type="add" /> Add
                </Button>
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}

export default KV;
