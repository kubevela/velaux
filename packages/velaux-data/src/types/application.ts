export enum DeployModes {
  Deploy = 'deploy',
  CanaryDeploy = 'canary-deploy',
}

export type DeployMode = DeployModes.CanaryDeploy | DeployModes.Deploy;
