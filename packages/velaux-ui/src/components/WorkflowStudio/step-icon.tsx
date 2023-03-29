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
import SvgWorkflow from '../Icons/SvgWorkflow';

export const StepTypeIcon = (props: { type: string }) => {
  switch (props.type) {
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
      return <SvgWorkflow width="24px" height="24px" />;
  }
};
