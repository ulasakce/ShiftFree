import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassComponents';
import { useData } from '../context/DataContext';
import { Role } from '../types';
import { User, Briefcase, Lock, AlertCircle, UserPlus, LogIn, Building, Leaf } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, registerAdmin } = useData();
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for registration
  const [companyName, setCompanyName] = useState(''); // Only for registration
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (isRegistering) {
        // Register Logic (Manager Only)
        if (role !== Role.MANAGER) {
            setError("Sadece yöneticiler yeni hesap oluşturabilir. Çalışan hesapları yönetici tarafından açılır.");
            setLoading(false);
            return;
        }
        if (!name || !email || !password || !companyName) {
             setError("Lütfen tüm alanları doldurun.");
             setLoading(false);
             return;
        }

        const result = await registerAdmin(name, email, password, companyName);
        if (result.success) {
            setSuccessMsg("Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.");
            setIsRegistering(false);
            setName('');
            setCompanyName('');
            setPassword('');
        } else {
            setError(result.message || "Kayıt başarısız.");
        }
    } else {
        // Login Logic
        const success = await login(email, password, role);
        if (!success) {
            setError("Kullanıcı bulunamadı veya bilgiler yanlış.");
        }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-300 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[120px] opacity-40"></div>

        <GlassCard className="w-full max-w-md p-8 animate-fade-in z-10">
            <div className="text-center mb-8">
                {/* Logo */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-700 to-sky-500 rounded-full mx-auto flex items-center justify-center text-white shadow-xl shadow-sky-200/50 mb-4 ring-4 ring-white/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                    <span className="text-blue-900">Shift-</span>
                    <span className="text-sky-500 relative">
                        Free
                        <Leaf size={16} className="text-emerald-500 absolute -top-1 -right-4 fill-emerald-500" />
                    </span>
                </h1>
                <p className="text-slate-500 text-sm mt-2">İzin yönetiminde modern yaklaşım.</p>
            </div>

            {/* View Toggle (Login vs Register) for Managers Only if needed, 
                but UI suggests role toggle first. Let's keep logic simple. */}
            
            <div className="flex justify-center mb-4 text-sm font-medium">
                 <button 
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    className={`px-4 py-2 border-b-2 transition-colors ${!isRegistering ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400'}`}
                 >
                     Giriş Yap
                 </button>
                 <button 
                    onClick={() => { setIsRegistering(true); setRole(Role.MANAGER); setError(null); }}
                    className={`px-4 py-2 border-b-2 transition-colors ${isRegistering ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400'}`}
                 >
                     Kayıt Ol (Yönetici)
                 </button>
            </div>

            {!isRegistering && (
                <div className="flex p-1 bg-slate-100/50 rounded-xl mb-6 border border-white/40">
                    <button 
                        onClick={() => { setRole(Role.EMPLOYEE); setError(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${role === Role.EMPLOYEE ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <User size={16} />
                        Çalışan
                    </button>
                    <button 
                        onClick={() => { setRole(Role.MANAGER); setError(null); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${role === Role.MANAGER ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Briefcase size={16} />
                        Yönetici
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-rose-200">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-emerald-200">
                        <UserPlus size={16} className="shrink-0 mt-0.5" />
                        {successMsg}
                    </div>
                )}
                
                {isRegistering && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Ad Soyad</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                                <GlassInput 
                                    type="text" 
                                    transparent={true}
                                    placeholder="Adınız Soyadınız"
                                    className="pl-11 border-slate-200"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Şirket İsmi</label>
                            <div className="relative group">
                                <Building className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                                <GlassInput 
                                    type="text" 
                                    transparent={true}
                                    placeholder="Şirket Adı"
                                    className="pl-11 border-slate-200"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">İş Maili</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <GlassInput 
                            type="email" 
                            transparent={true}
                            placeholder={role === Role.MANAGER ? "admin@sirket.com" : "isim@sirket.com"}
                            className="pl-11 border-slate-200"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(null); }}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Şifre</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <GlassInput 
                            type="password" 
                            transparent={true}
                            placeholder="******"
                            className="pl-11 border-slate-200"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(null); }}
                            required
                        />
                    </div>
                    {isRegistering && <p className="text-[10px] text-slate-400 mt-1 ml-1">En az 6 karakter.</p>}
                </div>

                <div className="pt-2">
                    <GlassButton disabled={loading} className="w-full !bg-gradient-to-r from-sky-500 to-indigo-500 !text-white !border-0 shadow-lg shadow-sky-200/50 hover:shadow-sky-300/60 flex justify-center !py-3">
                        {loading ? 'İşleniyor...' : (isRegistering ? 'Hesap Oluştur' : (role === Role.EMPLOYEE ? 'Çalışan Girişi' : 'Yönetici Girişi'))}
                    </GlassButton>
                </div>
            </form>

            {!isRegistering && (
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Not: Çalışan hesapları yönetici tarafından oluşturulur.</p>
                </div>
            )}
            
            {isRegistering && (
                 <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Yeni bir şirket hesabı oluşturuyorsunuz.</p>
                </div>
            )}
        </GlassCard>
    </div>
  );
};