'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function RegisterPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [fields,  setFields]  = useState({ email: '', username: '', display_name: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) { router.replace('/collection'); return; }
    gsap.fromTo(formRef.current,
      { opacity: 0, y: 30, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.2 }
    );
  }, [isAuthenticated]);

  function set(k: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(fields.email, fields.username, fields.password, fields.display_name);
      toast.success('Welcome to CardMatch!');
      router.push('/collection');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Registration failed';
      toast.error(msg || 'Registration failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20"
      style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(20,14,6,0.8) 0%, #080808 70%)' }}>

      <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm opacity-0">
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-lg text-gold">CardMatch</Link>
          <h1 className="font-display text-3xl mt-4 mb-2">Join the collectors.</h1>
          <p className="text-sm text-dim">Free forever. No credit card required.</p>
        </div>

        <a href={`${API}/auth/google`} className="flex items-center justify-center gap-3 btn btn-ghost w-full mb-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>
          Continue with Google
        </a>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 sep-gold" />
          <span className="text-[0.65rem] text-faint uppercase tracking-widest">or</span>
          <div className="flex-1 sep-gold" />
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="label text-[0.6rem] block mb-1.5">Email</label>
            <input type="email" className="input-base" placeholder="you@example.com" value={fields.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label text-[0.6rem] block mb-1.5">Username</label>
            <input type="text" className="input-base" placeholder="collector_handle" value={fields.username} onChange={set('username')} required minLength={3} maxLength={50} pattern="[a-zA-Z0-9_]+" />
          </div>
          <div>
            <label className="label text-[0.6rem] block mb-1.5">Display name <span className="text-faint">(optional)</span></label>
            <input type="text" className="input-base" placeholder="Your name" value={fields.display_name} onChange={set('display_name')} />
          </div>
          <div>
            <label className="label text-[0.6rem] block mb-1.5">Password</label>
            <input type="password" className="input-base" placeholder="Min 8 characters" value={fields.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-3.5 text-sm" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-xs text-dim mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-gold hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-[0.65rem] text-faint mt-4">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-dim">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-dim">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
