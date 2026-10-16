import React from 'react';
import ReactDOM from 'react-dom';

// environmentSlots name the places in the EnvironmentBar a page's own toolbar fills: its
// filters beside the env's name, its actions at the end of the views.
export const environmentSlots = { filters: 'environment-bar-filters', actions: 'environment-bar-actions' };

// EnvironmentSlot renders its children into a named place in the EnvironmentBar, so a
// page's toolbar sits in the bar rather than in a row of its own. Without the
// bar, it renders them where it stands.
export class EnvironmentSlot extends React.Component<
  { id: string; children: React.ReactNode },
  { el?: HTMLElement | null }
> {
  state: { el?: HTMLElement | null } = {};

  componentDidMount() {
    this.setState({ el: document.getElementById(this.props.id) });
  }

  render() {
    const { el } = this.state;
    if (el === undefined) {
      return null;
    }
    return el ? ReactDOM.createPortal(this.props.children, el) : <>{this.props.children}</>;
  }
}
