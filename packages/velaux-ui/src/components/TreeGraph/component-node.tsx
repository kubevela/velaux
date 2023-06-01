import { Balloon, Tag } from '@alifd/next';
import classNames from 'classnames';
import * as dagre from 'dagre';
import React, { useState } from 'react';

import { Translation } from '../Translation';

import type { GraphNode, GraphEdge, TraitGraphNode, Line } from './interface';
import { describeComponents, getGraphSize, ResourceIcon } from './utils';

import './component-node.less';
import type { TraitStatus } from '@velaux/data';
import { If } from '../If';

export interface ComponentNodeProps {
  node: GraphNode;
  showTrait: boolean;
}

function renderTraitTree(traits: TraitStatus[]) {
  const graph = new dagre.graphlib.Graph<TraitGraphNode, GraphEdge>();
  graph.setGraph({
    nodesep: 20,
    rankdir: 'TB',
    align: 'UL',
    ranksep: 26,
    compound: true,
  });

  // set node and make layout
  graph.setNode('graph-trait-start', {
    width: 5,
    height: 40,
    x: 0,
    y: 0,
  });
  traits.map((trait) => {
    graph.setEdge('graph-trait-start', trait.type, {});
    graph.setNode(trait.type, {
      trait: trait,
      width: 130,
      height: 30,
      x: 0,
      y: 0,
    });
  });
  dagre.layout(graph);
  const edges: Array<{ from: string; to: string; lines: Line[] }> = [];
  graph.edges().forEach((edgeInfo) => {
    const edge = graph.edge(edgeInfo);
    const lines: Line[] = [];
    if (edge.points && edge.points.length > 1) {
      for (let i = 1; i < edge.points.length; i++) {
        lines.push({
          x1: edge.points[i - 1].x,
          y1: edge.points[i - 1].y - 14,
          x2: edge.points[i].x,
          y2: edge.points[i].y - 14,
        });
      }
    }
    edges.push({
      from: edgeInfo.v,
      to: edgeInfo.w,
      lines: lines,
    });
  });
  const size = getGraphSize(graph.nodes().map((key) => graph.node(key)));
  return (
    <div
      className="trait-graph"
      style={{
        width: size.width,
        height: size.height,
        left: 190,
        transformOrigin: '0% 0%',
        transform: `scale(${1})`,
      }}
    >
      {graph.nodes().map((key) => {
        if (key === 'graph-trait-start') {
          return;
        }
        const { trait, x, y, width, height } = graph.node(key);
        if (!trait) {
          return;
        }
        const label = trait.type;
        const traitNode = (
          <div
            key={key}
            id={label}
            className={classNames('graph-node', 'trait-node')}
            style={{
              left: x + 22,
              top: y - 10,
              width: width,
              height: height,
              transform: `translate(-60px, 0px)`,
            }}
          >
            <div className={classNames('trait')}>
              <div>
                <span
                  className={classNames('circle', {
                    'circle-success': trait.healthy,
                    'circle-failure': !trait.healthy,
                  })}
                />
                {label}
              </div>
            </div>
          </div>
        );

        if (trait.message) {
          return (
            <Balloon trigger={traitNode}>
              <div>
                <p className="line">{`Message: ${trait.message}`}</p>
              </div>
            </Balloon>
          );
        }
        return traitNode;
      })}
      {edges.map((edge) => (
        <div key={`${edge.from}-${edge.to}`} className="graph-edge">
          {edge.lines.map((line) => {
            const distance = Math.sqrt(Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2));
            const xMid = (line.x1 + line.x2) / 2;
            const yMid = (line.y1 + line.y2) / 2;
            const angle = (Math.atan2(line.y1 - line.y2, line.x1 - line.x2) * 180) / Math.PI;
            return (
              <div
                className="graph-edge-line"
                key={'line' + line.x2 + line.y2}
                style={{
                  width: distance,
                  left: xMid - distance / 2,
                  top: yMid,
                  transform: `translate(40px, 30px) rotate(${angle}deg)`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const ComponentNode = (props: ComponentNodeProps) => {
  const { node } = props;
  const traits = node.resource.service?.traits || [];
  const [showTrait, setShowTrait] = useState(props.showTrait);
  const WithBalloon = (graphNode: React.ReactNode) => {
    return (
      <Balloon trigger={graphNode}>
        <div>
          {describeComponents(node).map((line: any) => {
            return <p className="line">{line}</p>;
          })}
        </div>
      </Balloon>
    );
  };
  const graphNode = (
    <div
      className={classNames('graph-node', 'graph-node-resource', {
        'warning-status': !node.resource.service?.healthy,
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
      {WithBalloon(
        <div className={classNames('name')}>
          <div>{node.resource.name}</div>
          <div className={classNames('healthy', { success: node.resource.service?.healthy })}>
            <If condition={node.resource.service?.healthy}>
              <span className="circle circle-success" />
              <Translation>Healthy</Translation>
            </If>
            <If condition={!node.resource.service?.healthy}>
              <span className="circle circle-warning" />
              <Translation>UnHealthy</Translation>
            </If>
          </div>
        </div>
      )}

      <If condition={traits.length > 0}>
        <div className={classNames('label-traits')}>
          {traits && traits.length > 0 && traits[0] && (                                                                                                                                                                                                                                                                                                                                                                                        
            <Tag animation={true}>
              <span
                className={classNames('circle', {
                  'circle-success': traits[0].healthy,
                  'circle-failure': !traits[0].healthy,
                })}
              />
              {traits[0].type}
            </Tag>
          )}
          <If condition={traits?.length > 1}>
            <div
              className={classNames('trait-num', { active: showTrait })}
              color="blue"
              style={{ marginLeft: '8px' }}
              onClick={() => setShowTrait(!showTrait)}
            >
              {traits?.length > 1 && '+' + (traits?.length - 1)}
            </div>
          </If>
        </div>
      </If>
      {traits.length > 1 && showTrait && renderTraitTree(traits)}
    </div>
  );
  return graphNode;
};
