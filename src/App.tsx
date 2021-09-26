import React from "react";
import BasicLoyout from "./layout/index";
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import "@b-design/ui/dist/index.css";


export default function App() {
  return (
    <Router>
      <Switch>
        <Route  path="/" component={BasicLoyout} />
      </Switch>

    </Router>
  );
};





