// generatedStepProperties are the properties KubeVela gives a step it
// generates: when a workflow declares no steps, each component is applied by
// an apply-component step named after it. A declared step has none here.
export function generatedStepProperties(
  workflow: { steps?: unknown[] } | undefined,
  step: { name?: string; type?: string } | undefined
): { component: string } | undefined {
  if (!step?.name || step.type !== 'apply-component' || (workflow?.steps && workflow.steps.length > 0)) {
    return undefined;
  }
  return { component: step.name };
}
