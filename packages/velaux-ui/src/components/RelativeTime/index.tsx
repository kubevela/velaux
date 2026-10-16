import React from 'react';

import { beautifyTime, momentDate } from '../../utils/common';

// RelativeTime is a time as how long ago it was, with the time itself on hover.
export const RelativeTime = (props: { time?: string }) => (
  <span title={momentDate(props.time)}>{beautifyTime(props.time)}</span>
);
