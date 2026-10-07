import * as React from 'react';
import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineInfoCircle } from 'react-icons/ai';

import { summaryEntries } from '../../utils/status';
import type { DetailEntry } from '../../utils/status';
import type { TooltipSection } from '../StatusTooltip';

import cRole from '../../assets/resources/c-role.svg';
import cm from '../../assets/resources/cm.svg';
import crb from '../../assets/resources/crb.svg';
import crd from '../../assets/resources/crd.svg';
import cronjob from '../../assets/resources/cronjob.svg';
import deploy from '../../assets/resources/deploy.svg';
import ds from '../../assets/resources/ds.svg';
import ep from '../../assets/resources/ep.svg';
import group from '../../assets/resources/group.svg';
import hpa from '../../assets/resources/hpa.svg';
import ing from '../../assets/resources/ing.svg';
import job from '../../assets/resources/job.svg';
import limits from '../../assets/resources/limits.svg';
import netpol from '../../assets/resources/netpol.svg';
import ns from '../../assets/resources/ns.svg';
import psp from '../../assets/resources/psp.svg';
import pv from '../../assets/resources/pv.svg';
import pvc from '../../assets/resources/pvc.svg';
import quota from '../../assets/resources/quota.svg';
import rb from '../../assets/resources/rb.svg';
import role from '../../assets/resources/role.svg';
import rs from '../../assets/resources/rs.svg';
import sa from '../../assets/resources/sa.svg';
import sc from '../../assets/resources/sc.svg';
import secret from '../../assets/resources/secret.svg';
import sts from '../../assets/resources/sts.svg';
import svc from '../../assets/resources/svc.svg';
import user from '../../assets/resources/user.svg';
import vol from '../../assets/resources/vol.svg';

import { componentNodeHeight, componentNodeWidth, layoutTraits, maxTraitRows, traitArea } from './traits';
import type { GraphNode, TreeNode } from './interface';

// componentSections lists what a component depends on and what depends on it,
// each with an arrow for its direction and, when KubeVela inferred it from a
// component read, an icon; both icons' tooltips say why.
export function componentSections(node: GraphNode): TooltipSection[] {
  const items = node.dependencies || [];
  if (items.length === 0) {
    return [];
  }
  const content = (
    <ul className="dependency-list">
      {items.map((item) => (
        <li key={`${item.kind || 'component'}:${item.direction}:${item.name}@${item.where || ''}`}>
          {item.direction === 'outbound' ? (
            <span
              className="dependency-direction"
              title={
                item.kind === 'source'
                  ? `Outbound: ${node.resource.name} reads the source ${item.name}`
                  : `Outbound: ${node.resource.name} depends on ${item.name}`
              }
            >
              <AiOutlineArrowRight />
            </span>
          ) : (
            <span className="dependency-direction" title={`Inbound: ${item.name} depends on ${node.resource.name}`}>
              <AiOutlineArrowLeft />
            </span>
          )}
          {item.name}
          {item.kind === 'source' && <span className="dependency-type dependency-source">source</span>}
          {item.type && <span className="dependency-type">{item.type}</span>}
          {item.where && <span className="dependency-where">in {item.where}</span>}
          {item.inferred && (
            <span className="inferred-dependency" title={item.inferred}>
              <AiOutlineInfoCircle />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
  return [{ title: 'Dependencies', count: items.length, content }];
}

export function componentSummary(node: GraphNode): DetailEntry[] {
  return summaryEntries([
    ['Alias', node.resource.component?.alias],
    ['Namespace', node.resource?.namespace],
    ['Cluster', node.resource.service?.cluster || 'local'],
  ]);
}

export function treeNodeKey(node: TreeNode & { uid?: string }) {
  if (node.uid && node.uid.length > 0) {
    return node.uid;
  }
  return nodeKey(node);
}

export function nodeKey(node: TreeNode) {
  return [
    node.resource.cluster,
    node.resource.apiVersion,
    node.resource.kind,
    node.resource.namespace,
    node.resource.name,
  ].join('/');
}

export function getNodeSize(node: TreeNode): { width: number; height: number } {
  // A resource has room for its health beside its name; one a component
  // applied has a line naming that component, and one more for the trait that
  // applied it, where one did.
  let width = node.nodeType == 'resource' ? 280 : 220;
  let height = node.origin ? (node.origin.trait ? 92 : 74) : node.nodeType == 'resource' ? 48 : 40;
  if (node.nodeType == 'cluster') {
    width = 140;
    height = 40;
  }
  if (node.nodeType == 'target') {
    width = 200;
    height = 40;
  }
  if (node.nodeType == 'app') {
    width = 180;
    height = 40;
  }
  if (node.nodeType == 'source') {
    width = 280;
    height = 64;
  }
  if (node.nodeType == 'flow') {
    width = 44;
    height = 18;
  }
  if (node.nodeType == 'pod') {
    width = 240;
    height = 66;
  }
  if (node.nodeType == 'component') {
    const types = (node.resource.service?.traits || []).map((t) => t.type);
    width = componentNodeWidth;
    height = componentNodeHeight(layoutTraits(types, traitArea, maxTraitRows).rows.length);
  }
  return { width, height };
}

const resourceIcons = new Map<string, string>([
  ['ClusterRole', cRole],
  ['ConfigMap', cm],
  ['ClusterRoleBinding', crb],
  ['CustomResourceDefinition', crd],
  ['CronJob', cronjob],
  ['Deployment', deploy],
  ['DaemonSet', ds],
  ['Endpoint', ep],
  ['Endpoints', ep],
  ['Group', group],
  ['HorizontalPodAutoscaler', hpa],
  ['Ingress', ing],
  ['Job', job],
  ['LimitRange', limits],
  ['NetworkPolicy', netpol],
  ['Namespace', ns],
  ['PodSecurityPolicy', psp],
  ['PersistentVolume', pv],
  ['PersistentVolumeClaim', pvc],
  ['Quote', quota],
  ['RoleBinding', rb],
  ['Role', role],
  ['ReplicaSet', rs],
  ['ServiceAccount', sa],
  ['StorageClass', sc],
  ['Secret', secret],
  ['StatefulSet', sts],
  ['Service', svc],
  ['User', user],
  ['Volume', vol],
]);

export const ResourceIcon = ({ kind, customStyle }: { kind: string; customStyle?: React.CSSProperties }) => {
  const svgName = resourceIcons.get(kind);
  if (svgName) {
    return <img title={kind} src={svgName} />;
  }
  const initials = kind.replace(/[a-z]/g, '');
  const n = initials.length;
  const style: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    overflow: 'hidden',
    padding: `${n <= 2 ? 2 : 0}px 4px`,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1b58f4',
    textAlign: 'center',
    lineHeight: '30px',
    ...customStyle,
  };
  return (
    <div style={style}>
      <span style={{ color: 'white', fontSize: `${n <= 2 ? 1 : 0.6}em` }}>{initials}</span>
    </div>
  );
};
