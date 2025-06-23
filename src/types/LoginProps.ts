export interface LoginProps {
  form: {
    email: string;
    password: string;
    rememberMe: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    email: string;
    password: string;
    rememberMe: boolean;
  }>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  errors: {
    email?: string;
    password?: string;
  };
  handleSubmit: () => void;
  isLoading: boolean;
  error: unknown;
}
