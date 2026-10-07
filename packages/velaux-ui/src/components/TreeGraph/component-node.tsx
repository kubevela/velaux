import { Balloon } from '@alifd/next';
import classNames from 'classnames';
import React, { useState } from 'react';

import type { GraphNode } from './interface';
import { componentSections, componentSummary } from './utils';
import { layoutTraits, maxTraitRows, traitArea } from './traits';

import './component-node.less';
import type { TraitStatus } from '@velaux/data';
import { BsBox } from 'react-icons/bs';

import { StatusBadge } from '../StatusBadge';

import { DefinitionLine } from './definition-line';
import { placeAt } from './layout';
import { traitState, traitStateCircle } from '../../utils/status';
import { traitTooltip } from './tooltip';
import { StatusTooltip, statusTooltipPopupClass } from '../StatusTooltip';

export interface ComponentNodeProps {
  node: GraphNode;
  showTrait: boolean;
}

// TraitChip is a trait on a component node, its status on hover.
const TraitChip = (props: { trait: TraitStatus }) => (
  <Balloon
    trigger={
      <span className="trait-chip">
        <span className={classNames('circle', traitStateCircle[traitState(props.trait)])} />
        {props.trait.type}
      </span>
    }
    closable={false}
    popupClassName={statusTooltipPopupClass}
  >
    <StatusTooltip {...traitTooltip(props.trait)} />
  </Balloon>
);

export const ComponentNode = (props: ComponentNodeProps) => {
  const { node } = props;
  const traits = node.resource.service?.traits || [];
  const [showTrait, setShowTrait] = useState(props.showTrait);
  const { rows, hidden } = layoutTraits(
    traits.map((t) => t.type),
    traitArea,
    maxTraitRows
  );
  const shown = rows.flat();
  const byType = (type: string) => traits.find((t) => t.type === type) as TraitStatus;
  const WithBalloon = (graphNode: React.ReactNode) => {
    return (
      <Balloon trigger={graphNode} closable={false} popupClassName={statusTooltipPopupClass}>
        <StatusTooltip
          title={node.resource.component?.componentType || node.resource.name}
          healthy={node.resource.service?.healthy}
          summary={componentSummary(node)}
          message={node.resource.service?.message}
          sections={componentSections(node)}
          details={node.resource.service?.details}
        />
      </Balloon>
    );
  };
  return (
    <div
      className={classNames('graph-node', 'graph-node-resource', 'graph-node-component', {
        'graph-node-edge': true,
        'tone-healthy': !!node.resource.service?.healthy,
        'tone-unhealthy': !node.resource.service?.healthy,
        'traits-open': hidden.length > 0 && showTrait,
      })}
      style={{
        ...placeAt(node, true),
      }}
    >
      {WithBalloon(
        <div className={classNames('icon')}>
          <BsBox />
        </div>
      )}
      <div className="component-node-body">
        {WithBalloon(
          <div className={classNames('name')}>
            <div className="component-node-title">
              <span className="component-node-name">{node.resource.name}</span>
              {node.resource.service?.healthy ? (
                <StatusBadge tone="healthy" label="Healthy" />
              ) : (
                <StatusBadge tone="unhealthy" label="Unhealthy" />
              )}
            </div>
            <DefinitionLine kind="component" type={node.resource.component?.componentType} />
          </div>
        )}
        {shown.length > 0 && (
          <div className="component-node-traits">
            {shown.map((type) => (
              <TraitChip key={type} trait={byType(type)} />
            ))}
            {hidden.length > 0 && (
              <button
                type="button"
                className={classNames('trait-more', { active: showTrait })}
                aria-expanded={showTrait}
                onClick={() => setShowTrait(!showTrait)}
              >
                +{hidden.length}
              </button>
            )}
          </div>
        )}
      </div>
      {hidden.length > 0 && showTrait && (
        <div className="trait-panel">
          {hidden.map((type) => (
            <TraitChip key={type} trait={byType(type)} />
          ))}
        </div>
      )}
    </div>
  );
};
