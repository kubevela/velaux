import React, { Component } from 'react';
import G6, { IG6GraphEvent, IGroup, IShape, ModelConfig } from '@antv/g6';
import './index.less';

type Props = {
  name: string;
  topologyNodes: [];
  topologyDataEdges: [];
  directComponentDetail: (name: string) => void;
};

type State = {
  topologyNodes: [];
  topologyDataEdges: [];
};

class TopologyChart extends Component<Props, State> {
  graph: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      topologyNodes: props.topologyNodes || [],
      topologyDataEdges: props.topologyDataEdges || [],
    };
  }

  componentDidMount() {
    this.renderTopology();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.topologyNodes !== this.props.topologyNodes) {
      this.setState(
        {
          topologyNodes: nextProps.topologyNodes || [],
          topologyDataEdges: nextProps.topologyDataEdges || [],
        },
        () => {
          this.renderTopology();
        },
      );
    }
  }

  directComponentDetail(ev: any) {
    const { model } = (ev.item && ev.item._cfg) || {};
    const componentName = model.name;
    this.props.directComponentDetail && this.props.directComponentDetail(componentName);
  }

  renderTopology() {
    const { name = 'container' } = this.props;
    const { topologyNodes, topologyDataEdges } = this.state;
    const data = {
      nodes: topologyNodes,
      edges: topologyDataEdges,
    };
    if (this.graph) {
      this.graph.destroy();
    }
    G6.registerNode(
      'sql',
      {
        drawShape(cfg?: ModelConfig | undefined, group?: IGroup | undefined): any {
          const rect =
            group &&
            group.addShape('rect', {
              attrs: {
                x: -75,
                y: -25,
                width: 150,
                height: 50,
                radius: 10,
                stroke: '#5B8FF9',
                fill: '#C6E5FF',
                lineWidth: 3,
              },
              name: 'rect-shape',
            });
          if (cfg && cfg.name) {
            group &&
              group.addShape('text', {
                attrs: {
                  text: cfg.name,
                  x: 0,
                  y: 0,
                  fill: '#00287E',
                  fontSize: 14,
                  textAlign: 'center',
                  textBaseline: 'middle',
                  fontWeight: 'bold',
                },
                name: 'text-shape',
              });
          }
          return rect;
        },
      },
      'single-node',
    );
    const rootEle: HTMLElement | null = document.getElementById('root');
    const container = document.getElementById(name);
    if (!container) {
      return;
    }
    const width = container.scrollWidth;
    const height = (rootEle && rootEle.clientHeight - 420) || 380;
    const graph = new G6.Graph({
      container: name,
      width,
      height,
      layout: {
        type: 'dagre',
        nodesepFunc: () => {
          return 50;
        },
        ranksep: 20,
        controlPoints: true,
      },
      defaultNode: {
        type: 'sql',
      },
      defaultEdge: {
        type: 'line',
        style: {
          radius: 20,
          offset: 45,
          endArrow: true,
          lineWidth: 2,
          stroke: '#C2C8D5',
        },
      },
      nodeStateStyles: {
        selected: {
          stroke: '#d9d9d9',
          fill: '#5394ef',
        },
      },
      modes: {
        default: [
          'drag-canvas',
          'drag-node',
          'zoom-canvas',
          'click-select',
          {
            type: 'tooltip',
            formatText(model: any) {
              return model.name;
            },
            offset: 30,
          },
        ],
      },
      fitView: true,
    });

    graph.on('node:click', (ev: IG6GraphEvent) => {
      this.directComponentDetail(ev);
    });

    graph.data(data);
    graph.render();
    this.graph = graph;

    if (typeof window !== 'undefined')
      window.onresize = () => {
        if (!graph || graph.get('destroyed')) return;
        if (!container || !container.scrollWidth || !container.scrollHeight) return;
        graph.changeSize(container.scrollWidth, container.scrollHeight);
      };
  }

  render() {
    const { name = 'container' } = this.props;
    return (
      <div>
        <div id={name} style={{ height: '100%' }}>
          {' '}
        </div>
      </div>
    );
  }
}

export default TopologyChart;
