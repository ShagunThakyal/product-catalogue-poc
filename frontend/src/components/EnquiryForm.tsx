import { useState, type FormEvent } from 'react';
import { api, ApiError, type Product } from '../api/client';

type Fields = { name: string; email: string; phone: string; message: string };

// Mirrors the backend rules for fast feedback; the backend stays the source of truth.
function validate(f: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'A valid email is required';
  if (f.phone && !/^[+()\-\s\d]*$/.test(f.phone)) errors.phone = 'Phone may only contain digits, spaces and + ( ) -';
  return errors;
}

export function EnquiryForm({ product, onCancel }: { product: Product; onCancel: () => void }) {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [formError, setFormError] = useState('');
  const [thanks, setThanks] = useState('');

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setFields({ ...fields, [k]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate(fields);
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return;
    setStatus('sending');
    try {
      const res = await api.enquire({ productId: product.id, ...fields });
      setThanks(res.message);
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'sent') {
    return (
      <div className="thanks" role="status">
        <h2>Thank you!</h2>
        <p>{thanks}</p>
      </div>
    );
  }

  const field = (k: keyof Fields, label: string, type = 'text') => (
    <label>
      {label}
      <input type={type} value={fields[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] && <span className="error">{errors[k]}</span>}
    </label>
  );

  return (
    <form className="enquiry" onSubmit={onSubmit} noValidate aria-label="Enquiry form">
      <h2>Enquire about {product.title}</h2>
      {field('name', 'Name *')}
      {field('email', 'Email *', 'email')}
      {field('phone', 'Phone', 'tel')}
      <label>
        Message
        <textarea value={fields.message} onChange={set('message')} rows={4} maxLength={2000} />
      </label>
      {formError && <p role="alert" className="error">{formError}</p>}
      <div className="actions">
        <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
