import { useState } from 'react';
import { ArrowLeft, LockKeyhole, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!validEmail(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (!values.password) nextErrors.password = 'Enter your password.';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      await login({ email: values.email.trim(), password: values.password });
      toast.success('Welcome back.');
      navigate(location.state?.from?.pathname || '/app/dashboard', { replace: true });
    } catch (error) {
      const fieldErrors = {};
      for (const detail of error.details || []) if (detail.field) fieldErrors[detail.field] = detail.message;
      setErrors(fieldErrors);
      setFormError(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-page px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to home</Link>
        <Card className="p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-brand"><LockKeyhole aria-hidden="true" className="h-5 w-5" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand">Welcome back</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Log in to your campus</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Pick up where your community left off.</p>
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{formError}</div>}
            <Input label="Email address" type="email" name="email" autoComplete="email" placeholder="you@campus.edu" value={values.email} onChange={(event) => update('email', event.target.value)} error={errors.email} />
            <Input label="Password" type="password" name="password" autoComplete="current-password" placeholder="Your password" value={values.password} onChange={(event) => update('password', event.target.value)} error={errors.password} />
            <Button type="submit" loading={submitting} className="w-full"><LogIn aria-hidden="true" className="h-4 w-4" />Log in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">New to Campus Club? <Link to="/register" className="font-semibold text-brand hover:text-brand-dark">Create an account</Link></p>
        </Card>
        <p className="mt-5 text-center text-xs text-slate-400">Your campus community is just a sign in away.</p>
      </div>
    </main>
  );
}
