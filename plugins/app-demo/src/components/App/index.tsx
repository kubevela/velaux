import * as React from 'react';
import { AppRootProps } from '@velaux/data';

export class App extends React.PureComponent<AppRootProps> {
  render() {
    return <div className="page-container">Hello KubeVela Plugin Words!</div>;
  }
}
