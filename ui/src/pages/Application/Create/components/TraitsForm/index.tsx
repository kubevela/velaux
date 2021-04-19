import React, { useState } from 'react';

import { Tabs } from 'antd';

import CapabilityFormItem from '../CapabilityForm';

interface TraitEntry extends API.TraitType {
  id: number;
}

interface FormProps {
  onChange: (traits: API.TraitType[]) => void;
  caps: API.CapabilityType[];
}

export default ({ onChange, caps }: FormProps) => {
  const [autoId, setAutoId] = useState(0);
  const [entries, setEntries] = useState<TraitEntry[]>([]);
  const [activeId, setActiveId] = useState<number>(autoId);

  const addItem = () => {
    const newId = autoId + 1;
    setAutoId(newId);
    setActiveId(newId);
    const newEntries = [...entries, { id: newId, type: '' }];
    setEntries(newEntries);
    onChange(newEntries);
  };

  const removeItem = (id: number) => {
    const newEntries = entries.filter((i) => i.id !== id);
    onChange(newEntries);
    setEntries(newEntries);
    const { length } = newEntries;
    if (id == activeId && length > 0) {
      setActiveId(newEntries[length - 1].id);
    }
  };

  const updateItem = (id: number, data: API.TraitType) => {
    const index = entries.findIndex((i) => i.id === id);
    if (index === -1) {
      return;
    }
    entries[index] = { ...data, id: id };
    setEntries([...entries]);
    onChange(entries);
  };

  return (
    <div>
      <Tabs
        type="editable-card"
        tabPosition="top"
        activeKey={activeId.toString()}
        onChange={(e) => setActiveId(parseFloat(e))}
        onEdit={(key, action) => {
          switch (action) {
            case 'add':
              addItem();
              break;
            case 'remove':
              removeItem(parseFloat(key.toString()));
              break;
            default:
              throw new Error(`invalid action '${action}'.`);
          }
        }}
      >
        {entries.map((item) => (
          <Tabs.TabPane key={item.id} tab={item.type ?? 'New trait'} closable>
            <CapabilityFormItem
              onChange={(current, old) => {
                const newTrait: API.TraitType = {
                  type: current.type,
                  properties: current.data,
                };
                updateItem(item.id, newTrait);
              }}
              disableCapabilities={entries.map((item) => item.type)}
              caps={caps}
            />
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};
