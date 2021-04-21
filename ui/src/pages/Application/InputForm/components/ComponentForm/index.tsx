import { Tabs } from 'antd';
import React, { useState } from 'react';
import ComponentFormItem, { ComponentEntry } from '../ComponentFormItem';

interface FormProps {
  onChange: (comps: API.ComponentType[]) => void;
  compDefs: API.CapabilityType[];
  traitDefs: API.CapabilityType[];
}

export default ({ onChange, compDefs, traitDefs }: FormProps) => {
  const [autoId, setAutoId] = useState(0);
  const [comps, setComps] = useState<ComponentEntry[]>([]);
  const [activeId, setActiveId] = useState<number>(autoId);

  const addComp = () => {
    const newId = autoId + 1;
    setAutoId(newId);
    setActiveId(newId);
    const newComps = comps.concat([{ id: newId, name: '' }]);
    setComps(newComps);
    onChange(newComps);
  };

  const removeComp = (id: number) => {
    const newComps = comps.filter((i) => i.id !== id);
    onChange(newComps);
    setComps(newComps);
    const { length } = newComps;
    if (id === activeId && length > 0) {
      setActiveId(newComps[length - 1].id);
    }
  };

  const updateComp = (id: number, updater: (comp: ComponentEntry) => ComponentEntry) => {
    const index = comps.findIndex((i) => i.id === id);
    if (index === -1) {
      return;
    }
    const current = comps[index];
    comps[index] = updater(current);
    const newComps = [...comps];
    setComps(newComps);
    onChange(newComps);
  };

  return (
    <Tabs
      type="editable-card"
      tabPosition="top"
      activeKey={activeId.toString()}
      onChange={(e) => setActiveId(parseFloat(e))}
      onEdit={(key, action) => {
        switch (action) {
          case 'add':
            addComp();
            break;
          case 'remove':
            removeComp(parseFloat(key.toString()));
            break;
          default:
            throw new Error(`invalid action '${action}'.`);
        }
      }}
    >
      {comps.map((comp) => (
        <Tabs.TabPane
          key={comp.id}
          tab={
            !comp.name || comp.name === '' ? (
              'New component'
            ) : (
              <div
                title={comp.name}
                style={{
                  maxWidth: '100px',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  wordBreak: 'break-all',
                }}
              >
                {comp.name}
              </div>
            )
          }
          forceRender
        >
          <ComponentFormItem
            component={comp}
            setComponent={(i) => updateComp(comp.id, () => i)}
            compDefs={compDefs}
            traitDefs={traitDefs}
          />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};
