import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from '../../pages/Login';
import Application from '../../pages/Application';
import Home from '../../pages/Home';
import Clust from '../../pages/Clust/index';
import { Operation } from '../../pages/Operation/index';
import { Plugins } from '../../pages/Plugins/index';
import Workflow from '../../pages/Workflow/index';
import General from '../../pages/General';

export default function Content() {
  return (
    <Switch>
      <Route path="/application/:name" component={General} />
      <Route path="/application" component={Application} />
      <Route path="/login" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/clust" component={Clust} />
      <Route path="/operation" component={Operation} />
      <Route path="/plugins" component={Plugins} />
      <Route path="/workflow" component={Workflow} />
      <Redirect from="/" to="/application" />
    </Switch>
  );
}
