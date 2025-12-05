import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Home, FileText, User as UserIcon, LogOut, Plus, Users, LayoutGrid, Trash2, Leaf, Edit2, X, Lock } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSelect, StatusBadge, UserAvatar, ConfirmationModal } from '../components/GlassComponents';
import { useData } from '../context/DataContext';
import { LeaveType, LeaveRequest, LeaveStatus } from '../types';

enum View {
  HOME = 'HOME',
  TEAM = 'TEAM',
  REQUEST = 'REQUEST',
  MY_LEAVES = 'MY_LEAVES',
  PROFILE = 'PROFILE',
}

export const EmployeeApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const { logout, addRequest, refreshData } = useData();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <HomeView onViewChange={setCurrentView} />;
      case View.TEAM:
        return <TeamView />;
      case View.REQUEST:
        return <RequestFormView onCancel={() => setCurrentView(View.HOME)} onSubmit={(req) => {
            addRequest(req);
            setCurrentView(View.MY_LEAVES);
        }} />;
      case View.MY_LEAVES:
        return <MyLeavesView />;
      case View.PROFILE:
        return <ProfileView onLogout={logout} />;
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="pb-32 relative min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-lg mx-auto p-4 space-y-5 pt-4">
        {renderContent()}
      </main>
      <BottomNav currentView={currentView} onChange={setCurrentView} />
    </div>
  );
};

const Header: React.FC = () => (
  // Floating Header Container
  <div className="sticky top-0 z-40 w-full pt-2 px-4 flex justify-center">
      {/* Floating Capsule Bar */}
      <header className="w-full max-w-lg h-16 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm flex justify-between items-center px-6 transition-all">
        <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                </svg>
            </div>
            {/* Logo Text */}
            <div className="flex flex-col justify-center">
                 <h1 className="text-lg font-bold tracking-tight leading-none">
                    <span className="text-blue-900">Shift-</span>
                    <span className="text-sky-500 relative">
                        Free
                        <Leaf size={10} className="text-emerald-500 absolute -top-1 -right-2 fill-emerald-500" />
                    </span>
                </h1>
            </div>
        </div>
        
        {/* Notification Button */}
        <button className="relative p-2 rounded-full hover:bg-white/50 transition-colors group">
          <Bell size={20} className="text-slate-600 group-hover:text-slate-800 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
      </header>
  </div>
);

const BottomNav: React.FC<{ currentView: View, onChange: (v: View) => void }> = ({ currentView, onChange }) => (
  <div className="fixed bottom-4 left-0 right-0 z-50 px-4 flex justify-center safe-area-bottom">
      {/* Floating Island Container */}
      <div className="w-full max-w-lg h-16 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_6px_16px_rgba(0,0,0,0.1)] relative flex justify-around items-center px-2">
        
        {/* Left Group */}
        <div className="flex flex-1 justify-around pr-8">
            <NavIcon 
                icon={LayoutGrid} 
                label="Home" 
                active={currentView === View.HOME} 
                onClick={() => onChange(View.HOME)} 
            />
            <NavIcon 
                icon={Users} 
                label="Ekip" 
                active={currentView === View.TEAM} 
                onClick={() => onChange(View.TEAM)} 
            />
        </div>

        {/* Center Floating Button - The "Cutout" Effect */}
        {/* The border color (border-slate-50) MUST match the page background color (#f8fafc / slate-50) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[90px] h-[90px] rounded-full bg-transparent flex items-center justify-center pointer-events-none">
            <div className="w-full h-full rounded-full bg-white/20 border-[8px] border-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center pointer-events-auto cursor-pointer relative overflow-hidden group"
                 onClick={() => onChange(View.REQUEST)}
            >
                 {/* Inner Gradient Button */}
                 <div className="w-full h-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center transition-transform active:scale-95">
                    <Plus size={32} strokeWidth={3} className="text-white group-hover:rotate-90 transition-transform duration-300" />
                 </div>
            </div>
        </div>

        {/* Right Group */}
        <div className="flex flex-1 justify-around pl-8">
            <NavIcon 
                icon={FileText} 
                label="İzinler" 
                active={currentView === View.MY_LEAVES} 
                onClick={() => onChange(View.MY_LEAVES)} 
            />
            <NavIcon 
                icon={UserIcon} 
                label="Profil" 
                active={currentView === View.PROFILE} 
                onClick={() => onChange(View.PROFILE)} 
            />
        </div>

      </div>
  </div>
);

const NavIcon: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 transition-all w-12 h-12 rounded-xl ${active ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    {/* Optional: Label can be hidden for cleaner look, or shown nicely */}
    {/* <span className={`text-[9px] font-medium ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span> */}
  </button>
);

// --- Sub Views ---

const HomeView: React.FC<{ onViewChange: (v: View) => void }> = ({ onViewChange }) => {
  const { currentUser, myBalances, requests } = useData();
  const remainingDays = myBalances.find(b => b.type === LeaveType.ANNUAL)?.remaining || 0;
  
  // Only show my requests
  const myRequests = requests.filter(r => r.userId === currentUser?.id).slice(0, 2);

  return (
    <div className="space-y-5 animate-fade-in">
      <GlassCard className="flex items-center gap-4 !py-4">
        {currentUser && <UserAvatar name={currentUser.name} size="lg" className="text-slate-800" />}
        <div>
          <p className="text-slate-500 text-xs font-medium">Tekrar Merhaba,</p>
          <h2 className="text-lg font-bold text-slate-800">{currentUser?.name}</h2>
          {currentUser?.jobTitle && <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">{currentUser.jobTitle}</span>}
        </div>
      </GlassCard>

      <GlassCard className="text-center py-6 relative overflow-hidden group cursor-pointer" >
          {/* Decorative shapes */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-200/30 rounded-full blur-2xl group-hover:bg-sky-200/50 transition-colors"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl"></div>

          <h3 className="text-slate-500 font-medium mb-1 text-sm">Kalan İzin Hakkı</h3>
          <div className="text-5xl font-bold text-sky-500 mb-2 tracking-tight">{remainingDays} <span className="text-xl text-slate-400 font-normal">Gün</span></div>
          <p className="text-xs text-slate-400 mb-5">31 Aralık {new Date().getFullYear()} tarihine kadar geçerli</p>
          
          <GlassButton onClick={() => onViewChange(View.REQUEST)} className="mx-auto w-full max-w-[180px] !py-2.5 !text-sm">
             İzin Talep Et
          </GlassButton>
      </GlassCard>

      <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-bold text-slate-700">Son Hareketler</h3>
          <button onClick={() => onViewChange(View.MY_LEAVES)} className="text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-1 rounded-lg">Tümünü Gör</button>
      </div>
      
      <div className="space-y-3">
          {myRequests.length === 0 ? <p className="text-slate-400 text-sm px-2 italic">Henüz izin talebiniz yok.</p> : null}
          {myRequests.map(req => (
              <GlassCard key={req.id} className="p-4 flex justify-between items-center">
                  <div>
                      <div className="font-semibold text-slate-700 text-sm">{req.type}</div>
                      <div className="text-xs text-slate-500">{new Date(req.startDate).toLocaleDateString('tr-TR')} • {req.days} Gün</div>
                  </div>
                  <StatusBadge status={req.status} />
              </GlassCard>
          ))}
      </div>
    </div>
  );
};

// New View to balance the navbar
const TeamView: React.FC = () => {
    const { requests, currentUser, users } = useData();
    // Filter approved requests that overlap with today or future
    const today = new Date();
    const teamLeaves = requests.filter(r => 
        r.status === LeaveStatus.APPROVED && 
        new Date(r.endDate) >= today &&
        r.userId !== currentUser?.id
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-slate-700">Ekip Takvimi</h2>
            <p className="text-slate-500 text-xs -mt-5">Ekibinizdeki diğer kişilerin izin durumları.</p>

            <div className="space-y-3">
                 {teamLeaves.length === 0 ? (
                     <div className="text-center py-10 bg-white/30 rounded-2xl border border-white/40">
                         <Users size={32} className="mx-auto text-slate-300 mb-2" />
                         <p className="text-slate-500 text-sm">Şu anda izinli kimse yok.</p>
                     </div>
                 ) : (
                     teamLeaves.map(req => {
                         const user = users.find(u => u.id === req.userId);
                         return (
                            <GlassCard key={req.id} className="flex items-center gap-3 !p-3">
                                <UserAvatar name={req.userName} size="md" className="text-slate-800" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-700 text-sm">{req.userName}</h4>
                                        {user?.jobTitle && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{user.jobTitle}</span>}
                                    </div>
                                    <p className="text-xs text-sky-600 font-medium mt-0.5">
                                        {new Date(req.startDate).toLocaleDateString('tr-TR')} - {new Date(req.endDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-bold">{req.type}</span>
                                </div>
                            </GlassCard>
                         );
                     })
                 )}
            </div>
        </div>
    )
}

const RequestFormView: React.FC<{ onCancel: () => void, onSubmit: (r: LeaveRequest) => void }> = ({ onCancel, onSubmit }) => {
    const { currentUser } = useData();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<LeaveType>(LeaveType.ANNUAL);
    const [reason, setReason] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (!currentUser) return;

        const newRequest: LeaveRequest = {
            id: Date.now().toString(),
            companyId: currentUser.companyId,
            userId: currentUser.id,
            userName: currentUser.name,
            type,
            startDate,
            endDate,
            days: days > 0 ? days : 1,
            reason,
            status: LeaveStatus.PENDING,
            requestedAt: new Date().toISOString().split('T')[0]
        };
        onSubmit(newRequest);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-700">Yeni İzin Talebi</h2>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm font-medium">İptal</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <GlassCard className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">İzin Türü</label>
                        <GlassSelect value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
                            {Object.values(LeaveType).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </GlassSelect>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Başlangıç</label>
                            <GlassInput type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Bitiş</label>
                            <GlassInput type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    
                    {/* V2 Rule Warning */}
                    {type === LeaveType.ANNUAL && (
                         <div className="bg-sky-50/80 border border-sky-100 rounded-lg p-3 flex gap-3 items-start">
                            <Calendar size={18} className="text-sky-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-sky-700 leading-relaxed">
                                <strong>Bilgi:</strong> Yıllık izin talepleri şirket politikası gereği en az 7 gün önceden yapılmalıdır.
                            </p>
                         </div>
                    )}

                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Gerekçe (Opsiyonel)</label>
                         <textarea 
                            className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 min-h-[100px] text-sm"
                            placeholder="İzninizi açıklayan kısa bir not..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                         ></textarea>
                    </div>
                </GlassCard>

                <GlassButton type="submit" className="w-full !py-3">Talebi Gönder</GlassButton>
            </form>
        </div>
    );
};

const MyLeavesView: React.FC = () => {
    const { requests, currentUser, myBalances, deleteRequest } = useData();
    const myRequests = requests.filter(r => r.userId === currentUser?.id);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, requestId: string | null }>({ isOpen: false, requestId: null });

    const total = myBalances.reduce((acc, curr) => acc + curr.total, 0);
    const used = myBalances.reduce((acc, curr) => acc + curr.used, 0);
    const remaining = myBalances.reduce((acc, curr) => acc + curr.remaining, 0);

    const initiateDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, requestId: id });
    };

    const confirmDelete = () => {
        if (deleteModal.requestId) {
            deleteRequest(deleteModal.requestId);
        }
        setDeleteModal({ isOpen: false, requestId: null });
    };

    return (
    <div className="space-y-5 animate-fade-in">
         <h2 className="text-xl font-bold text-slate-700">İzinlerim</h2>
         <div className="grid grid-cols-3 gap-3">
             {[
                 { label: 'Toplam', val: total, color: 'text-slate-600' },
                 { label: 'Kullanılan', val: used, color: 'text-rose-600' },
                 { label: 'Kalan', val: remaining, color: 'text-sky-600' }
             ].map((stat, i) => (
                 <GlassCard key={i} className="p-3 text-center !rounded-xl">
                     <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                     <div className={`text-xl font-bold ${stat.color}`}>{stat.val}</div>
                 </GlassCard>
             ))}
         </div>

         <div className="space-y-4">
            {myRequests.length === 0 ? <p className="text-center text-slate-400 mt-8 text-sm">Henüz izin talebi oluşturmadınız.</p> : null}
            {myRequests.map(req => (
                <GlassCard key={req.id} className="relative !p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                             <h4 className="font-bold text-slate-700 text-sm">{req.type}</h4>
                             <p className="text-[10px] text-slate-400">{new Date(req.requestedAt).toLocaleDateString('tr-TR')} tarihinde talep edildi</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={req.status} />
                            {req.status === LeaveStatus.PENDING && (
                                <button 
                                    onClick={(e) => initiateDelete(e, req.id)}
                                    className="p-1.5 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                    title="Talebi Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/40 p-2.5 rounded-lg w-full">
                        <Calendar size={16} className="text-sky-500" />
                        <span className="font-medium text-slate-700">{new Date(req.startDate).toLocaleDateString('tr-TR')} - {new Date(req.endDate).toLocaleDateString('tr-TR')}</span>
                        <span className="ml-auto font-bold text-sky-600">{req.days} Gün</span>
                    </div>
                </GlassCard>
            ))}
         </div>

         <ConfirmationModal 
             isOpen={deleteModal.isOpen}
             title="İzin Talebini Sil"
             message="Bu izin talebini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
             onConfirm={confirmDelete}
             onCancel={() => setDeleteModal({ isOpen: false, requestId: null })}
         />
    </div>
)};

const ProfileView: React.FC<{onLogout: () => void}> = ({onLogout}) => {
    const { currentUser, myBalances, updateProfile } = useData();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPass, setEditPass] = useState('');

    useEffect(() => {
        if(currentUser) {
            setEditName(currentUser.name);
        }
    }, [currentUser]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await updateProfile(editName, editPass);
        if(res.success) {
            setIsEditOpen(false);
            setEditPass('');
            alert("Profil güncellendi.");
        } else {
            alert("Hata: " + res.message);
        }
    };

    return (
    <div className="space-y-6 animate-fade-in">
         <GlassCard className="flex flex-col items-center py-8 relative">
             <button onClick={() => setIsEditOpen(true)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-sky-500 hover:bg-sky-50 transition-colors">
                 <Edit2 size={16} />
             </button>

             <div className="mb-4">
                {currentUser && <UserAvatar name={currentUser.name} size="xl" className="text-slate-800" />}
             </div>
             <h2 className="text-2xl font-bold text-slate-800">{currentUser?.name}</h2>
             <div className="flex gap-2 items-center mt-2">
                 <p className="text-slate-500 font-medium text-sm">{currentUser?.department}</p>
                 {currentUser?.jobTitle && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">{currentUser.jobTitle}</span>}
             </div>
             <p className="text-slate-400 text-xs mt-1">Yönetici: {currentUser?.managerName}</p>
             
             <button onClick={onLogout} className="mt-6 flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors text-sm font-bold px-6 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100">
                 <LogOut size={16} />
                 Çıkış Yap
             </button>
         </GlassCard>

         <GlassCard className="!p-0 overflow-hidden">
             <div className="p-4 border-b border-white/30 bg-white/30">
                 <h3 className="font-bold text-slate-700 text-sm">İzin Bakiyesi Detayları</h3>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="text-[10px] text-slate-500 bg-white/40 uppercase tracking-wider font-bold">
                         <tr>
                             <th className="px-4 py-3">Tür</th>
                             <th className="px-4 py-3 text-center">Hak</th>
                             <th className="px-4 py-3 text-center">Kul.</th>
                             <th className="px-4 py-3 text-center">Kal.</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/30">
                         {myBalances.map((b, i) => (
                             <tr key={i} className="hover:bg-white/20 transition-colors">
                                 <td className="px-4 py-3 font-medium text-slate-700">{b.type}</td>
                                 <td className="px-4 py-3 text-center text-slate-500">{b.total}</td>
                                 <td className="px-4 py-3 text-center text-rose-500 font-semibold">{b.used}</td>
                                 <td className="px-4 py-3 text-center text-emerald-500 font-bold">{b.remaining}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         </GlassCard>

         {/* Edit Profile Modal */}
         {isEditOpen && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                <GlassCard className="w-full max-w-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Profili Düzenle</h3>
                        <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
                            <GlassInput value={editName} onChange={e => setEditName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Yeni Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                                <GlassInput type="password" value={editPass} onChange={e => setEditPass(e.target.value)} placeholder="Değiştirmek için yazın..." className="pl-10" />
                            </div>
                        </div>
                        <GlassButton type="submit" className="w-full">Güncelle</GlassButton>
                    </form>
                </GlassCard>
             </div>
         )}
    </div>
)};