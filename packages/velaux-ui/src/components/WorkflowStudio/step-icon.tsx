import { DeployModes } from '@velaux/data';
import React from 'react';
import { AiOutlineSafetyCertificate } from 'react-icons/ai';

import SvgApi from '../Icons/SvgAPI';
import SvgEp from '../Icons/SvgEp';
import SvgKubernetes from '../Icons/SvgKubernetes';
import SvgNotification from '../Icons/SvgNotification';
import SvgSecret from '../Icons/SvgSecret';
import SvgSvc from '../Icons/SvgSvc';
import SvgTerraform from '../Icons/SvgTerraform';

// stepTypeIcon is the icon drawn for a step type, if it has its own.
const stepTypeIcon = (type: string): React.ReactElement | undefined => {
  switch (type) {
    case DeployModes.Deploy:
    case DeployModes.CanaryDeploy:
      return <SvgKubernetes width="24px" height="24px" />;
    case 'deploy-cloud-resource':
      return <SvgTerraform width="24px" height="24px" />;
    case 'export-service':
    case 'share-cloud-resource':
      return (
        <SvgSvc
          width="24px"
          height="24px"
          style={{
            color: 'var(--primary-color)',
          }}
        />
      );
    case 'read-config':
    case 'list-config':
    case 'create-config':
    case 'delete-config':
    case 'export-data':
      return (
        <SvgSecret
          width="24px"
          height="24px"
          style={{
            color: 'var(--primary-color)',
          }}
        />
      );
    case 'notification':
      return <SvgNotification width="24px" height="24px" />;
    case 'webhook':
      return <SvgApi width="24px" height="24px" />;
    case 'suspend':
      return <AiOutlineSafetyCertificate size="24" />;
    case 'collect-service-endpoints':
      return (
        <SvgEp
          width="24px"
          height="24px"
          style={{
            color: 'var(--primary-color)',
          }}
        />
      );
    default:
      return undefined;
  }
};

// StepTypeTile is a step type's icon for picking it, or the initials of its
// name where it has no icon of its own.
export const StepTypeTile = (props: { type: string }) =>
  stepTypeIcon(props.type) || (
    <span className="step-type-initials">
      {props.type
        .split(/[-_0-9]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')}
    </span>
  );
