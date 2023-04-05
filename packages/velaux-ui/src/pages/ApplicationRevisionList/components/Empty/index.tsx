import React from 'react';

import { Translation } from '../../../../components/Translation';

const Empty = function () {
  return (
    <div>
      <h4>
        <Translation>No version record</Translation>
      </h4>
      <p>
        <Translation>Your version record will be displayed here after release</Translation>
      </p>
    </div>
  );
};

export default Empty;
