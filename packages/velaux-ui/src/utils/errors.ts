/*
Copyright 2021 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Message } from '@alifd/next';

import { isMatchBusinessCode } from './common';

export interface APIError {
  BusinessCode: number;
  Message: string;
}

export function handleError(err: APIError) {
  // TODO: Handle errors based on businessCode
  const isShowErrFlag = isMatchBusinessCode(err.BusinessCode);
  if (err && !isShowErrFlag) {
    Message.error({ title: err.Message, duration: 3000 });
  }
}
