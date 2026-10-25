import { useState } from 'react';
import { ArrowLeft, UserRoundPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function validPassword(value) { return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value); }

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', studentId: '', department: '' });
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
    if (values.name.trim().length < 2 || values.name.trim().length > 80) nextErrors.name = 'Name must be between 2 and 80 characters.';
    if (!validEmail(values.email)) nextErrors.email = 'Enter a valid email address.';
    if (!validPassword(values.password)) nextErrors.password = 'Use at least 8 characters, including one letter and one number.';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      await register({
        name: values.name.trim(), email: values.email.trim(), password: values.password,
        ...(values.studentId.trim() ? { studentId: values.studentId.trim() } : {}),
        ...(values.department.trim() ? { department: values.department.trim() } : {}),
      });
      toast.success('Your account is ready. Welcome!');
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      const fieldErrors = {};
      for (const detail of error.details || []) if (detail.field) fieldErrors[detail.field] = detail.message;
      setErrors(fieldErrors);
      setFormError(error.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-page px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to home</Link>
        <Card className="p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-brand"><UserRoundPlus aria-hidden="true" className="h-5 w-5" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand">Join the community</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Start with the basics. You can fill in the rest later.</p>
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            {formError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{formError}</div>}
            <Input label="Full name" name="name" autoComplete="name" placeholder="Your name" value={values.name} onChange={(event) => update('name', event.target.value)} error={errors.name} />
            <Input label="Email address" type="email" name="email" autoComplete="email" placeholder="you@campus.edu" value={values.email} onChange={(event) => update('email', event.target.value)} error={errors.email} />
            <Input label="Password" type="password" name="password" autoComplete="new-password" placeholder="At least 8 characters" value={values.password} onChange={(event) => update('password', event.target.value)} error={errors.password} hint="Include at least one letter and one number." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Student ID" name="studentId" placeholder="Optional" value={values.studentId} onChange={(event) => update('studentId', event.target.value)} error={errors.studentId} />
              <Input label="Department" name="department" placeholder="Optional" value={values.department} onChange={(event) => update('department', event.target.value)} error={errors.department} />
            </div>
            <Button type="submit" loading={submitting} className="mt-2 w-full"><UserRoundPlus aria-hidden="true" className="h-4 w-4" />Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Already a member? <Link to="/login" className="font-semibold text-brand hover:text-brand-dark">Log in</Link></p>
        </Card>
      </div>
    </main>
  );
}
