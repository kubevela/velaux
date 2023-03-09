import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import BasicLayout from './layout/index';
import '@b-design/ui/dist/index.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={BasicLayout} />
      </Switch>
    </Router>
  );
}
