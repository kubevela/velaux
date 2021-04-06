import React, {useState} from 'react';

import {Tabs} from 'antd';

import CapabilityFormItem from '../CapabilityFormItem';

interface TraitItem {
  id: number;
  type?: string;
}

const TraitsFrom: React.FC<{
  onChange?: (traits: API.TraitType[]) => void;
  caps: API.CapabilityType[];
}> = ({onChange, caps}) => {
  const [items, setItems] = useState<TraitItem[]>([{id: 1}]);
  const [activeId, setActiveId] = useState<number>(1);
  const [data, setData] = useState<API.TraitType[]>([]);

  const removeFormData = (key: string) => {
    const newTraits = data.filter(item => item.type !== key)
    setData(newTraits)
  };

  const addItem = () => {
    const newId = items.length + 1;
    setItems([...items, {id: newId}]);
    setActiveId(newId);
  };

  const removeItem = (id: number) => {
    const removedItem = items.find((i) => i.id === id);
    if (removedItem == null) {
      return;
    }
    if (removedItem.type != null) {
      removeFormData(removedItem.type);
    }

    const newItems = items.filter((i) => i !== removedItem);
    setItems(newItems);
    const {length} = newItems;
    if (length > 0) {
      setActiveId(newItems[length - 1].id);
    }
  };

  const updateItem = (id: number, updater: (item: TraitItem) => TraitItem) => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      return;
    }
    const current = items[index];
    items[index] = updater(current);
    setItems([...items]);
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
        {items.map((item) => (
          <Tabs.TabPane key={item.id} tab={item.type ?? 'New trait'} closable>
            <CapabilityFormItem
              onSelect={(e) => {
                updateItem(item.id, (i) => ({...i, type: e}));
              }}
              onChange={(current, old) => {
                if (old?.capabilityType != null) {
                  removeFormData(old.capabilityType);
                }
                const newTrait: API.TraitType = {
                  type: current.capabilityType,
                  properties: current.data,
                }
                data.push(newTrait)
                setData(data);
                if (onChange != null) {
                  onChange(data);
                }
              }}
              disableCapabilities={data.map(item => item.type)}
              caps={caps}
            />
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default TraitsFrom;
