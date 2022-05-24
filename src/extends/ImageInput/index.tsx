import React, { Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Input, Loading } from '@b-design/ui';
import Translation from '../../components/Translation';
import { checkImageName } from '../../api/project';
import { If } from 'tsx-control-statements/components';
import type { InputProps } from '@alifd/next/types/input';
import './index.less';

interface Props extends InputProps {
  value: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
  project?: string;
  mode: 'new' | 'edit';
  onChangeImagePullSecretsRef: (data: string) => void;
}

type State = {
  errorNotice: string;
  isLoading: boolean;
  secretName: string;
  status?: 'warning' | 'success' | 'error' | 'loading' | undefined;
};

@connect((store: any) => {
  return { ...store.uischema };
})
class ImageInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      errorNotice: '',
      isLoading: false,
      secretName: '',
    };
  }

  componentDidMount = async () => {
    const { mode } = this.props;
    if (mode === 'edit') {
      this.onCheckImageName();
    }
  };

  onCheckImageName = () => {
    const { value, project, onChangeImagePullSecretsRef } = this.props;
    if (project && value) {
      const imageData = {
        image: value,
        project,
      };
      this.setState({ isLoading: true });
      checkImageName(imageData)
        .then((res) => {
          const data = (res && res.data) || {};
          if (!data.existed) {
            this.setState({
              status: 'warning',
              secretName: '',
              errorNotice: data.message || '',
            });
            onChangeImagePullSecretsRef('');
          } else if (data.existed) {
            const { secret = '' } = data;
            this.setState({
              status: 'success',
              secretName: secret,
              errorNotice: '',
            });
            onChangeImagePullSecretsRef(secret);
          }
        })
        .finally(() =>
          this.setState({
            isLoading: false,
          }),
        );
    }
  };

  onChange = (value: string) => {
    this.setState({ errorNotice: '', status: undefined });
    const { onChange } = this.props;
    onChange(value);
  };
  render() {
    const { value } = this.props;
    const { errorNotice, status, secretName, isLoading } = this.state;
    return (
      <Fragment>
        <Loading visible={isLoading} inline={false} className="loading-imageInput-wrapper">
          <Input
            addonTextBefore={secretName}
            state={status}
            defaultValue={value}
            value={value}
            onChange={this.onChange}
            onBlur={this.onCheckImageName}
            onPressEnter={this.onCheckImageName}
          />
        </Loading>
        <div className="margin-top-10">
          <Translation>To deploy from a private image repository, you need to first</Translation>
          &nbsp;
          <Link to="/definitions">
            <Translation>create an image registry secret</Translation>
          </Link>
        </div>
        <If condition={errorNotice}>
          <div className="imageInput-error-info">
            <Translation>{errorNotice}</Translation>
          </div>
        </If>
      </Fragment>
    );
  }
}

export default ImageInput;
