import { useFormValidation, FormField, FormInput, loginSchema, type LoginFormData } from "@kids/forms";
import { Button } from "@kids/ui-kit";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="login-form">
      <h2 className="login-form__title">登录</h2>

      <FormField label="邮箱" error={errors.email} required>
        <FormInput
          {...register("email")}
          type="email"
          placeholder="请输入邮箱地址"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <FormField label="密码" error={errors.password} required>
        <FormInput
          {...register("password")}
          type="password"
          placeholder="请输入密码"
          disabled={isSubmitting || isLoading}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || isLoading}
        style={{ width: "100%", marginTop: "1rem" }}
      >
        {isSubmitting || isLoading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
