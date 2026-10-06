import { Balloon } from '@alifd/next';
import classNames from 'classnames';
import React, { useState } from 'react';

import type { GraphNode } from './interface';
import { componentSections, componentSummary, ResourceIcon } from './utils';
import { layoutTraits, maxTraitRows, traitArea } from './traits';

import './component-node.less';
import type { TraitStatus } from '@velaux/data';
import { StatusBadge } from '../StatusBadge';
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
        'warning-status': !node.resource.service?.healthy,
        'traits-open': hidden.length > 0 && showTrait,
      })}
      style={{
        // 50 = (nodeWidth - 220)/2
        left: node.x - 50,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-80px, 0px)`,
      }}
    >
      {WithBalloon(
        <div className={classNames('icon')}>
          <ResourceIcon kind={node.resource.component?.componentType.substring(0, 1).toUpperCase() || ''} />
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
            <div className="kind">{node.resource.component?.componentType}</div>
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
