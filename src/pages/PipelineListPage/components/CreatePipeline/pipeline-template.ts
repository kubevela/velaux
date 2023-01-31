export const templates = [
  {
    label: 'Observability Template',
    defaultContext: {
      readConfig: 'false',
    },
    value: `
- name: Enable Prism
  type: addon-operation
  properties:
    addonName: vela-prism

- name: Enable o11y
  type: addon-operation
  properties:
    addonName: o11y-definitions
    operation: enable
    args:
      - --override-definitions

- name: Enable Exporter
  type: step-group
  subSteps:
  - name: Node Exporter
    type: addon-operation
    properties:
      addonName: node-exporter
      operation: enable

  - name: Kube State Exporter
    type: addon-operation
    properties:
      addonName: kube-state-metrics
      operation: enable

- name: Prepare Prometheus
  type: step-group
  subSteps:
    - name: get-exist-prometheus
      type: list-config
      properties:
        template: prometheus-server
        namespace: vela-system
      outputs:
        - name: prometheus
          valueFrom: "output.configs"

    - name: prometheus-server
      inputs:
        - from: prometheus
          parameterKey: configs
      if: context.readConfig == "false" || len(inputs.prometheus) == 0
      type: addon-operation
      properties:
        addonName: prometheus-server
        operation: enable
        args:
          - memory=1024Mi

- name: Prepare Loki
  type: addon-operation
  properties:
    addonName: loki
    operation: enable
    args:
      - agent=vector

- name: Prepare Grafana
  type: step-group
  subSteps:
    - name: get-exist-grafana
      type: list-config
      properties:
        template: grafana
        namespace: vela-system
      outputs:
        - name: grafana
          valueFrom: "output.configs"

    - name: Install Grafana & Init Dashboards
      inputs:
        - from: grafana
          parameterKey: configs
      if: context.readConfig == "false" || len(inputs.grafana) == 0
      type: addon-operation
      properties:
        addonName: grafana
        operation: enable
        args:
          - serviceType=LoadBalancer

    - name: Init Dashboards
      inputs:
        - from: grafana
          parameterKey: configs
      if: "len(inputs.grafana) != 0"
      type: addon-operation
      properties:
        addonName: grafana
        operation: enable
        args:
          - install=false

- name: Clean
  type: clean-jobs

- name: print-message
  type: print-message-in-status
  properties:
    message: "All addons have been enabled successfully, you can use 'vela addon list' to check them."
`,
  },
];
