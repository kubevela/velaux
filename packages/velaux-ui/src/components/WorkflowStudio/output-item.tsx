import { Grid, Input, Form, Button } from '@alifd/next';
import _ from 'lodash';
import React, { useState } from 'react';
import { IoMdAdd, IoMdRemove } from 'react-icons/io';

import type { OutputItem } from '@velaux/data';
import { locale } from '../../utils/locale';
const { Row, Col } = Grid;

export const OutputItemForm = (props: { value?: OutputItem; onChange: (i: OutputItem) => void }) => {
  const [name, setName] = useState<string>(props.value ? props.value.name : '');
  const [valueFrom, setValueFrom] = useState<string>(props.value?.valueFrom || '');
  const nameChange = (value: string) => {
    setName(value);
    if (value != '' && valueFrom != '') {
      props.onChange({ name: value, valueFrom: valueFrom });
    }
  };
  const valueFromChange = (value: string) => {
    setValueFrom(value);
    if (name != '' && value != '') {
      props.onChange({ name: name, valueFrom: value });
    }
  };

  return (
    <div className="item-form">
      <Row>
        <Col className="from" span={12} style={{ paddingLeft: '8px' }}>
          <Form.Item label="Name" labelAlign="inset">
            <Input locale={locale().Select} value={name} onChange={nameChange} />
          </Form.Item>
        </Col>
        <Col span={12} style={{ paddingRight: '8px' }}>
          <Form.Item label="ValueFrom" labelAlign="inset">
            <Input value={valueFrom} onChange={valueFromChange} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export const OutputItems = (props: { value?: OutputItem[]; id: string; onChange: (items: OutputItem[]) => void }) => {
  const [items, setItems] = useState<OutputItem[]>(props.value || [{ name: '', valueFrom: '' }]);

  const onChange = (update: OutputItem[]) => {
    props.onChange(update.filter((item) => item.name != '' && item.valueFrom != ''));
  };

  return (
    <div id={props.id} className="input-items">
      {items?.map((item, index) => {
        const key = `index${index}`;
        return (
          <div className="item" key={key}>
            <OutputItemForm
              key={item.name}
              value={item}
              onChange={(output) => {
                items[index].name = output.name;
                items[index].valueFrom = output.valueFrom;
                onChange(items);
              }}
            />

            {index != 0 && (
              <div className="item-delete">
                <Button
                  onClick={() => {
                    const newItems = _.cloneDeep(items);
                    newItems.splice(index, 1);
                    setItems(newItems);
                    onChange(newItems);
                  }}
                  size="small"
                  type="secondary"
                  style={{ justifyContent: 'center', marginLeft: '8px' }}
                >
                  <IoMdRemove />
                </Button>
              </div>
            )}
          </div>
        );
      })}
      <Button
        onClick={() => {
          const newItems = _.cloneDeep(items);
          newItems.push({ name: '', valueFrom: '' });
          setItems(newItems);
        }}
        size="small"
        type="secondary"
        style={{ justifyContent: 'center', marginLeft: '8px' }}
      >
        <IoMdAdd />
      </Button>
    </div>
  );
};
