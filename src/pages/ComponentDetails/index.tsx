import React, { Component } from 'react';
import { connect } from 'dva';
import Title from './components/Title';
import TabsContent from './components/tabs-content/index';
import './index.less';
import { Loading } from '@alifd/next';

type Props = {
  match: {
    params: {
      appName: string;
      componentName: string;
    };
  };
  applicationList: [];
  components: [];
  componentDetails: {};
  loading: { global: Boolean };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
};

type State = {
  appName: string;
  componentName: string;
};
@connect((store: any) => {
  return { ...store.application, ...store.componentDetails, loading: store.loading };
})
class ComponentDetails extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = this.props.match;
    this.state = {
      appName: params.appName,
      componentName: params.componentName,
    };
  }
  //when applicationList,components no API data, need fetch API
  componentDidMount() {
    this.getComponentDetails();
    const { applicationList = [], components = [] } = this.props;
    if (applicationList.length === 0) {
      this.getApplicationList();
    }
    if (components.length === 0) {
      this.getApplicationComponents();
    }
  }

  getApplicationList = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: {},
    });
  };

  getApplicationComponents = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: {
        urlParam: appName,
      },
    });
  };

  getComponentDetails = async () => {
    const { appName, componentName } = this.state;
    this.props.dispatch({
      type: 'application/getComponentDetails',
      payload: {
        urlParam: {
          name: appName,
          componentName: componentName,
        },
      },
    });
  };

  changeAppNamne = (value: string) => {
    const { componentName } = this.state;
    this.props.history.push(`/applications/${value}/components/${componentName}`, {});
    this.setState(
      {
        appName: value,
      },
      () => {
        this.getComponentDetails();
      },
    );
  };

  changeComponentName = (value: string) => {
    const { appName } = this.state;
    this.props.history.push(`/applications/${appName}/components/${value}`, {});
    this.setState(
      {
        componentName: value,
      },
      () => {
        this.getComponentDetails();
      },
    );
  };

  render() {
    const { history, applicationList = [], components = [], loading, dispatch } = this.props;
    const { appName, componentName } = this.state;
    const isLoading = loading.global === true ? true : false;

    return (
      <div className="details">
        <Title
          appName={appName}
          componentName={componentName}
          applicationList={applicationList}
          components={components}
          changeAppNamne={(value: string) => {
            this.changeAppNamne(value);
          }}
          changeComponentName={(value: string) => {
            this.changeComponentName(value);
          }}
          history={history}
        />
        <Loading tip="loading..." fullScreen visible={isLoading}>
          <TabsContent dispatch={dispatch} />
        </Loading>
      </div>
    );
  }
}

export default ComponentDetails;
