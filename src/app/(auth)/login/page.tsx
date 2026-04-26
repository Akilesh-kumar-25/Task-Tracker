'use client';

import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ensureUserExists } from '@/lib/db';
import { Layout, Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

// Form validation schema
const authSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);

      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        if (data.name) {
          await updateProfile(userCredential.user, { displayName: data.name });
          await ensureUserExists(userCredential.user, data.name);
        }
      }
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password');
      } else if (err.code === 'auth/user-not-found') {
        setError('User not found');
      } else {
        setError('Authentication failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0ebe6] p-4 font-sans selection:bg-[#8b7f74] selection:text-white overflow-hidden">
      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d1c7bc]/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8b7f74]/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo/Brand Section */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#5c544d] rounded-3xl shadow-xl mb-4 transform hover:scale-110 transition-transform cursor-default">
            <Layout className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-heading italic text-[#5c544d] tracking-tight">
            Mastery Portal
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74] mt-2 opacity-60">
            Precision Habit Tracking
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-[40px] bg-white/70 shadow-[0_32px_64px_-16px_rgba(92,84,77,0.15)] backdrop-blur-2xl border border-white animate-in fade-in zoom-in-95 duration-1000">
          <div className="p-10">
            {/* Auth Toggle (Tabs) */}
            <div className="mb-10 flex bg-[#e9e4df] p-1.5 rounded-2xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isLogin 
                    ? 'bg-white text-[#5c544d] shadow-md' 
                    : 'text-[#8b7f74] hover:text-[#5c544d]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  !isLogin 
                    ? 'bg-white text-[#5c544d] shadow-md' 
                    : 'text-[#8b7f74] hover:text-[#5c544d]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b7f74] group-focus-within:text-[#5c544d] transition-colors" />
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="your name"
                      className="w-full rounded-2xl border-none bg-[#f0ebe6] pl-12 pr-4 py-4 text-sm font-bold text-[#5c544d] placeholder:text-[#8b7f74]/40 outline-none focus:ring-2 ring-[#8b7f74]/20 transition-all shadow-inner"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.name.message}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b7f74] group-focus-within:text-[#5c544d] transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border-none bg-[#f0ebe6] pl-12 pr-4 py-4 text-sm font-bold text-[#5c544d] placeholder:text-[#8b7f74]/40 outline-none focus:ring-2 ring-[#8b7f74]/20 transition-all shadow-inner"
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] ml-1">Secure Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b7f74] group-focus-within:text-[#5c544d] transition-colors" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border-none bg-[#f0ebe6] pl-12 pr-12 py-4 text-sm font-bold text-[#5c544d] placeholder:text-[#8b7f74]/40 outline-none focus:ring-2 ring-[#8b7f74]/20 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#8b7f74] hover:text-[#5c544d] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-[10px] font-bold text-rose-600 border border-rose-100 animate-shake">
                  <Shield size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-14 rounded-3xl bg-[#5c544d] text-white shadow-[0_12px_24px_-8px_rgba(92,84,77,0.4)] transition-all hover:bg-[#4a433d] hover:shadow-[0_16px_32px_-8px_rgba(92,84,77,0.5)] active:scale-[0.98] disabled:opacity-50 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Enter Portal' : 'Create Mastery ID'}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-[#f0ebe6]/50 px-10 py-6 text-center border-t border-white">
            <p className="text-[10px] font-bold text-[#8b7f74]">
              {isLogin ? "NEVER BEEN HERE BEFORE? " : "ALREADY PART OF THE CORE? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#5c544d] font-black hover:underline"
              >
                {isLogin ? 'JOIN NOW' : 'SIGN IN'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
