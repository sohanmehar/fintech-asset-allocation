import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('risk.officer@capitalguard.internal');
  const [password, setPassword] = useState('••••••••••••');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F4EE] text-[#1C2925] flex flex-col justify-center items-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#E5E3DA_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

      <div className="w-full max-w-md bg-[#FAF9F5] border border-[#E5E3DA] rounded-2xl p-8 shadow-md relative z-10 space-y-6">
        {/* Brand Header matching reference screenshot 1 */}
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#E5BF56] font-serif text-2xl font-bold mx-auto shadow-inner">
            P
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold tracking-wider text-[#1C2925] uppercase">
              PORTFOLIO RISK ENGINE
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Institutional Allocation & Optimization Platform
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1C2925]">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E5E3DA] rounded-lg text-xs text-[#1C2925] font-medium focus:outline-none focus:border-[#1D5B4B] transition-colors"
                placeholder="name@firm.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#1C2925]">Password</label>
              <span className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer font-medium">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E5E3DA] rounded-lg text-xs text-[#1C2925] font-medium focus:outline-none focus:border-[#1D5B4B] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1D5B4B] hover:bg-[#133E35] text-white font-bold rounded-lg text-xs transition-colors shadow-sm mt-2 cursor-pointer"
          >
            <span>Sign In to Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Institutional Note */}
        <div className="pt-4 border-t border-[#E5E3DA] text-center">
          <p className="text-[11px] text-stone-500 font-medium">
            Institutional Access Only • Authorized Governance System
          </p>
        </div>
      </div>
    </div>
  );
};

