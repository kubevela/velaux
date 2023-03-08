import React from 'react';
import 'mocha';
import { render } from '@testing-library/react';

import App from './App';

describe('renders learn react link', () => {
  render(<App />);
});
