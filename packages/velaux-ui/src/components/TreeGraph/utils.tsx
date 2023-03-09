import * as React from 'react';


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

import type { GraphNode, TreeNode, Node } from './interface';

export function describeNode(node: GraphNode) {
  const lines = [
    `Kind: ${node.resource.kind}`,
    `Namespace: ${node.resource.namespace || '(global)'}`,
    `Name: ${node.resource.name}`,
  ];
  if (node.resource.healthStatus?.statusCode) {
    let statue = `Status: ${node.resource.healthStatus?.statusCode}`;
    if (node.resource.kind === 'Pod') {
      statue = statue + `(${node.resource.additionalInfo?.Status})`;
    }
    lines.push(statue);
  }
  if (node.resource.healthStatus?.message) {
    lines.push(`Message: ${node.resource.healthStatus?.message}`);
  }
  if (node.resource.healthStatus?.reason) {
    lines.push(`Reason: ${node.resource.healthStatus?.reason}`);
  }
  if (node.resource.kind === 'Service' && node.resource.additionalInfo?.EIP) {
    lines.push(`EIP: ${node.resource.additionalInfo?.EIP}`);
  }
  if (node.resource.kind === 'Pod') {
    lines.push(`Age: ${node.resource.additionalInfo?.Age}`);
    lines.push(`Ready: ${node.resource.additionalInfo?.Ready}`);
    lines.push(`Restarts: ${node.resource.additionalInfo?.Restarts}`);
  }
  return lines;
}

export function describeCluster(node: GraphNode) {
  const lines = [`Cluster: ${node.resource.name}`];
  return lines;
}

export function describeTarget(node: GraphNode) {
  const info = node.resource.name.split('/');
  if (info.length > 1) {
    const lines = [`Cluster: ${info[0]}`, `Namespace: ${info[1]}`];
    return lines;
  }
  return [`Cluster: ${node.resource.name}`];
}

export function describeComponents(node: GraphNode) {
  const lines = [
    `Name: ${node.resource.name}`,
    `Alias: ${node.resource.component?.alias}`,
    `Type: ${node.resource.component?.componentType}`,
    `DependsOn: ${node.resource.component?.dependsOn || []}`,
    `Namespace: ${node.resource?.namespace}`,
    `Cluster: ${node.resource.service?.cluster || 'local'}`,
  ];
  if (node.resource.service?.message) {
    lines.push(`Message: ${node.resource.service?.message}`);
  }
  return lines;
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

export function getGraphSize(nodes: Node[]): { width: number; height: number } {
  let width = 0;
  let height = 0;
  nodes.forEach((node) => {
    width = Math.max(node.x || 0 + node.width, width);
    height = Math.max(node.y || 0 + node.height, height);
  });
  return { width, height };
}

export function getNodeSize(node: TreeNode): { width: number; height: number } {
  let width = 220;
  let height = 40;
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
  if (node.nodeType == 'pod') {
    width = 220;
    height = 60;
  }
  if (node.nodeType == 'component') {
    width = 320;
    height = 40;
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

export const ResourceIcon = ({
  kind,
  customStyle,
}: {
  kind: string;
  customStyle?: React.CSSProperties;
}) => {
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
