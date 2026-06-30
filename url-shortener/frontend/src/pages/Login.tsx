import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from 'shared';
import type { LoginRequest } from 'shared';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    resolver: zodResolver(LoginSchema)
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate('/admin');
    },
  });

  const onSubmit = (data: LoginRequest) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
       <div className="absolute top-4 left-4">
         <Link to="/" className="text-sm hover:underline">&larr; Back to Home</Link>
      </div>
      <div className="max-w-sm w-full bg-[var(--bg)] p-8 rounded-lg border border-[var(--border)] shadow-[var(--shadow)]">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              {...register('password')}
              className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--bg)]"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[var(--accent)] text-white py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
          >
            {mutation.isPending ? 'Logging in...' : 'Login'}
          </button>

          {mutation.isError && (
             <p className="text-red-500 text-sm text-center">
                {mutation.error instanceof Error ? mutation.error.message : 'Login failed'}
             </p>
          )}
        </form>
      </div>
    </div>
  );
}
