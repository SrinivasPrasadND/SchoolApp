import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, LogIn } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/schemas';
import { TextField } from '@/components/forms/Fields';
import { Button } from '@/components/common/Button';
import { useLoginMutation } from '@/services/api/endpoints';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { APP_NAME, DEMO_CREDENTIALS, ROLE_HOME } from '@/constants';
import { parseApiError } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: true },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const result = await login({
        identifier: values.identifier,
        password: values.password,
        rememberMe: values.rememberMe,
      }).unwrap();
      dispatch(setCredentials(result));
      toast(`Welcome back, ${result.user.name}!`, 'success');
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? ROLE_HOME[result.user.role], { replace: true });
    } catch (err) {
      setFormError(parseApiError(err).message);
    }
  };

  const fillDemo = (identifier: string) => {
    setValue('identifier', identifier);
    setValue('password', 'password123');
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white lg:w-1/2 lg:p-12">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8" aria-hidden />
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </div>
        <div className="hidden lg:block">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            One platform for administrators, teachers, parents, and students.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Manage fees, attendance, homework, announcements, and leave — all in a fast,
            mobile-friendly experience.
          </p>
        </div>
        <p className="mt-8 text-sm text-brand-200 lg:mt-0">
          Prototype build · Mock data · No real payments
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use a demo account below or your credentials.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Login form">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
              >
                {formError}
              </div>
            )}

            <TextField
              label="Email or username"
              type="text"
              autoComplete="username"
              required
              error={errors.identifier?.message}
              {...register('identifier')}
            />

            <div className="relative">
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('rememberMe')} />
                Remember me
              </label>
              <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isLoading}>
              <LogIn className="h-4 w-4" aria-hidden /> Sign in
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo accounts (password: password123)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.identifier}
                  type="button"
                  onClick={() => fillDemo(cred.identifier)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="block text-sm font-medium text-slate-900">{cred.role}</span>
                  <span className="block truncate text-xs text-slate-500">{cred.identifier}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
