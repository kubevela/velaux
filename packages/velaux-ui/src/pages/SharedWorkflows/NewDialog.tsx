import { Button, Dialog, Field, Form, Input, Radio } from '@alifd/next';
import React from 'react';

import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import { checkName } from '../../utils/common';

export type NewSharedWorkflow = {
  name: string;
  alias?: string;
  scope: 'project' | 'global';
};

type Props = {
  // copyOf names the workflow being copied, for the title.
  copyOf?: string;
  initial: NewSharedWorkflow;
  canProject: boolean;
  canGlobal: boolean;
  onClose: () => void;
  onOk: (values: NewSharedWorkflow) => void;
};

// NewDialog names a new shared workflow and picks where it lives, before the
// studio opens on it. Nothing is created until the studio saves.
export const NewDialog = (props: Props) => {
  const field = Field.useField({ values: props.initial });
  const { init } = field;
  const submit = () =>
    field.validate((errors, values: any) => {
      if (!errors) {
        props.onOk(values as NewSharedWorkflow);
      }
    });
  return (
    <Dialog
      v2
      visible
      width={560}
      title={
        props.copyOf ? (
          <span>
            <Translation>Copy</Translation> <code>{props.copyOf}</code>
          </span>
        ) : (
          <Translation>New Workflow</Translation>
        )
      }
      onClose={props.onClose}
      footer={
        <div>
          <Button onClick={props.onClose} style={{ marginRight: '8px' }}>
            <Translation>Cancel</Translation>
          </Button>
          <Button type="primary" onClick={submit}>
            <Translation>Open in the studio</Translation>
          </Button>
        </div>
      }
    >
      <Form field={field} labelAlign="top" fullWidth>
        <Form.Item label={<Translation>Name</Translation>} required>
          <Input
            {...init('name', {
              rules: [
                { required: true, message: i18n.t('Enter a name').toString() },
                {
                  pattern: checkName,
                  message: i18n.t('Lower case letters, digits and dashes, starting with a letter.').toString(),
                },
              ],
            })}
          />
        </Form.Item>
        <Form.Item label={<Translation>Alias</Translation>}>
          <Input
            {...init('alias', {
              rules: [{ minLength: 2, maxLength: 64, message: 'Enter a string of 2 to 64 characters.' }],
            })}
          />
        </Form.Item>
        <Form.Item
          label={<Translation>Where</Translation>}
          help={i18n
            .t(
              field.getValue('scope') === 'global'
                ? 'Every project can use a global one. Only admins can change it.'
                : "Only this project's applications can use it."
            )
            .toString()}
        >
          <Radio.Group {...init('scope')}>
            <Radio value="project" disabled={!props.canProject}>
              <Translation>Project</Translation>
            </Radio>
            <Radio value="global" disabled={!props.canGlobal}>
              <Translation>Global</Translation>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Dialog>
  );
};
