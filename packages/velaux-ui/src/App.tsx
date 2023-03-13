import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import BasicLayout from './layout/index';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={BasicLayout} />
      </Switch>
    </Router>
  );
}
