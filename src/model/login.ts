export interface ILogin {
  username: string;
  password: string;
}

export const createEmptyLogin = (): ILogin => ({
  username: '',
  password: '',
});

export interface IUser {
  userId: string;
}
