import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Settings, PieChart as ChartIcon, Check, X, User, Sparkles, LogOut, Download, Calendar as CalendarIcon, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Users as UsersIcon, Mail, Briefcase, Shield, FolderPlus, Folder, Database, Upload, FileSpreadsheet, Link, RefreshCw, AlertCircle, AlertTriangle, ArrowLeft, Copy, Terminal, Scale, Leaf, BookOpen, Lock } from 'lucide-react';
import { GlassCard, GlassButton, StatusBadge, GlassInput, GlassSelect, UserAvatar, ConfirmationModal } from '../components/GlassComponents';
import { useData } from '../context/DataContext';
import { LeaveRequest, LeaveStatus, AutoApprovalRule, LeaveType, Role, User as UserType, CompanyPolicy, LeaveBalance } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { generateLeaveInsights } from '../services/geminiService';
import * as XLSX from 'xlsx';

enum ManagerView {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  USERS = 'USERS',
  ROLES = 'ROLES',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  SETUP = 'SETUP',
  POLICIES = 'POLICIES',
}

export const ManagerApp: React.FC = () => {
  const [view, setView] = useState<ManagerView>(ManagerView.DASHBOARD);
  const { currentUser, logout, refreshData, updateProfile } = useData();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePass, setProfilePass] = useState('');

  useEffect(() => {
    refreshData();
    if(currentUser) setProfileName(currentUser.name);
  }, [refreshData, currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await updateProfile(profileName, profilePass);
      if(res.success) {
          setIsProfileModalOpen(false);
          setProfilePass('');
          alert("Profil güncellendi.");
      } else {
          alert("Hata: " + res.message);
      }
  };

  const renderContent = () => {
    switch (view) {
      case ManagerView.DASHBOARD: return <DashboardView />;
      case ManagerView.CALENDAR: return <CalendarView />;
      case ManagerView.USERS: return <UsersView onNavigate={setView} />;
      case ManagerView.ROLES: return <RolesView onNavigate={setView} />;
      case ManagerView.ANALYTICS: return <AnalyticsView />;
      case ManagerView.POLICIES: return <PoliciesView />;
      case ManagerView.SETTINGS: return <SettingsView />;
      case ManagerView.SETUP: return <SetupView onNavigate={setView} />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white/40 backdrop-blur-xl border-r border-white/40 hidden md:flex flex-col">
        <div className="p-6">
             {/* Branding */}
             <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                    </svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    <span className="text-blue-900">Shift-</span>
                    <span className="text-sky-500 relative">
                        Free
                        <Leaf size={10} className="text-emerald-500 absolute -top-1 -right-2 fill-emerald-500" />
                    </span>
                </h1>
             </div>
             <p className="text-[10px] text-slate-400 uppercase tracking-widest pl-1">Yönetici Paneli</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="İzin Akışı" active={view === ManagerView.DASHBOARD} onClick={() => setView(ManagerView.DASHBOARD)} />
            <SidebarItem icon={CalendarIcon} label="Takvim" active={view === ManagerView.CALENDAR} onClick={() => setView(ManagerView.CALENDAR)} />
            <SidebarItem icon={UsersIcon} label="Çalışanlar" active={view === ManagerView.USERS} onClick={() => setView(ManagerView.USERS)} />
            <SidebarItem icon={Shield} label="Şirket Rolleri" active={view === ManagerView.ROLES} onClick={() => setView(ManagerView.ROLES)} />
            <SidebarItem icon={ChartIcon} label="Analizler" active={view === ManagerView.ANALYTICS} onClick={() => setView(ManagerView.ANALYTICS)} />
            <SidebarItem icon={BookOpen} label="İzin Politikaları" active={view === ManagerView.POLICIES} onClick={() => setView(ManagerView.POLICIES)} />
            <SidebarItem icon={Settings} label="Bot Ayarları" active={view === ManagerView.SETTINGS} onClick={() => setView(ManagerView.SETTINGS)} />
            <SidebarItem icon={Database} label="Kurulum" active={view === ManagerView.SETUP} onClick={() => setView(ManagerView.SETUP)} />
        </nav>
        <div className="p-6">
            <GlassCard className="!p-3 flex items-center justify-between gap-2 !bg-white/60">
                <div 
                    className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setIsProfileModalOpen(true)}
                >
                    {currentUser && <UserAvatar name={currentUser.name} size="sm" className="text-slate-800" />}
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-700 truncate">{currentUser?.name}</div>
                        <div className="text-[10px] text-slate-500">Admin (Düzenle)</div>
                    </div>
                </div>
                <button onClick={logout} className="text-rose-400 hover:text-rose-600 transition-colors" title="Çıkış Yap">
                    <LogOut size={18} />
                </button>
            </GlassCard>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
         {/* Mobile Header */}
         <div className="md:hidden p-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-20 border-b border-white/20 bg-white/40">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                    </svg>
                </div>
                <h1 className="text-lg font-bold text-sky-600">Admin</h1>
            </div>
            <div className="flex gap-2 items-center">
                <button onClick={() => setView(ManagerView.DASHBOARD)}><LayoutDashboard className={view === ManagerView.DASHBOARD ? "text-sky-500" : "text-slate-400"} /></button>
                <button onClick={() => setView(ManagerView.USERS)}><UsersIcon className={view === ManagerView.USERS ? "text-sky-500" : "text-slate-400"} /></button>
                <button onClick={() => setIsProfileModalOpen(true)} className="text-slate-400"><User size={20} /></button>
                <button onClick={logout} className="ml-2 text-rose-500"><LogOut size={20} /></button>
            </div>
         </div>

         <div className="p-6 md:p-10 max-w-6xl mx-auto">
            {renderContent()}
         </div>
      </main>

      {/* Manager Profile Edit Modal */}
      {isProfileModalOpen && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                <GlassCard className="w-full max-w-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Yönetici Profili</h3>
                        <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
                            <GlassInput value={profileName} onChange={e => setProfileName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Yeni Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                                <GlassInput type="password" value={profilePass} onChange={e => setProfilePass(e.target.value)} placeholder="Değiştirmek için yazın..." className="pl-10" />
                            </div>
                        </div>
                        <GlassButton type="submit" className="w-full">Güncelle</GlassButton>
                    </form>
                </GlassCard>
             </div>
         )}
    </div>
  );
};

const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-sky-100/50 text-sky-700 shadow-sm font-semibold' : 'text-slate-500 hover:bg-white/30 hover:text-slate-700'}`}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span className="text-sm">{label}</span>
    </button>
);

// --- Sub Views ---

const SetupView: React.FC<{ onNavigate: (v: ManagerView) => void }> = ({ onNavigate }) => {
    const { syncFromFile, isCloudSynced } = useData();
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus("Yükleniyor...");
        
        const result = await syncFromFile(file);
        
        setUploading(false);
        setUploadStatus(result.message || (result.success ? "Başarılı" : "Hata"));
        if(result.success) {
            setTimeout(() => setUploadStatus(null), 5000);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
             <header className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Kurulum ve Veri Aktarımı</h2>
                <p className="text-slate-500">Excel dosyasından toplu veri yükleyin.</p>
             </header>

             <GlassCard className="flex flex-col items-center p-8 space-y-6">
                 {isCloudSynced ? (
                     <div className="flex flex-col items-center gap-2">
                         <div className="bg-emerald-50 p-4 rounded-full text-emerald-500">
                             <Check size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-700">Veritabanı Bağlı</h3>
                         <p className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                             Supabase bağlantısı aktif
                         </p>
                     </div>
                 ) : (
                     <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-center gap-2">
                         <AlertCircle />
                         <span>Veritabanı bağlantısı yapılandırılamadı. Lütfen yönetici ile iletişime geçin.</span>
                     </div>
                 )}
                 
                 <div className="w-full border-t border-slate-100 my-4"></div>
                 
                 <div className="w-full text-center space-y-4">
                     <h4 className="font-semibold text-slate-700">Excel'den Veri Çek</h4>
                     <p className="text-sm text-slate-500 max-w-md mx-auto">
                         <strong>worker</strong> ve <strong>dayoff</strong> sayfalarını içeren Excel dosyanızı yükleyerek veritabanını güncelleyebilirsiniz.
                     </p>
                     
                     <div 
                         className="border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-xl p-8 cursor-pointer hover:bg-sky-50 transition-colors"
                         onClick={() => fileInputRef.current?.click()}
                     >
                         <input 
                             type="file" 
                             ref={fileInputRef} 
                             onChange={handleFileUpload} 
                             accept=".xlsx, .xls" 
                             className="hidden" 
                         />
                         <Upload size={32} className="mx-auto text-sky-400 mb-2" />
                         <span className="text-sm font-medium text-sky-700">Excel Dosyasını Seç veya Sürükle</span>
                     </div>
                     
                     {uploading && (
                         <div className="text-sm text-sky-600 animate-pulse">İşleniyor...</div>
                     )}
                     
                     {uploadStatus && !uploading && (
                         <div className={`text-sm p-2 rounded-lg ${uploadStatus.includes('Hata') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                             {uploadStatus}
                         </div>
                     )}
                 </div>
                 
                 <div className="flex justify-center mt-4">
                     <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); /* Logic to download template if needed */}} 
                        className="text-xs text-slate-400 hover:text-sky-500 flex items-center gap-1"
                     >
                         <Download size={12} /> Örnek Şablon İndir
                     </a>
                 </div>
             </GlassCard>
        </div>
    );
};

const RolesView: React.FC<{onNavigate: (v: ManagerView) => void}> = ({onNavigate}) => {
    const { departments, isCloudSynced, addDepartment, deleteDepartment, addRoleToDepartment, deleteRoleFromDepartment } = useData();
    const [newDept, setNewDept] = useState('');
    const [newRoles, setNewRoles] = useState<Record<string, string>>({});
    
    // Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: 'DEPT' | 'ROLE' | null;
        id: string | null;
        secondaryId?: string; // For role name
        title: string;
        message: string;
    }>({ isOpen: false, type: null, id: null, title: '', message: '' });

    const handleAddDept = (e: React.FormEvent) => {
        e.preventDefault();
        if(newDept.trim()) {
            addDepartment(newDept);
            setNewDept('');
        }
    };

    const handleAddRole = (deptId: string) => {
        const role = newRoles[deptId];
        if(role && role.trim()) {
            addRoleToDepartment(deptId, role);
            setNewRoles(prev => ({...prev, [deptId]: ''}));
        }
    };

    const initiateDeleteDept = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteModal({
            isOpen: true, type: 'DEPT', id,
            title: 'Departmanı Sil',
            message: 'Bu departmanı ve altındaki tüm rolleri silmek istediğinize emin misiniz?'
        });
    };

    const initiateDeleteRole = (e: React.MouseEvent, deptId: string, role: string) => {
        e.stopPropagation();
        setDeleteModal({
            isOpen: true, type: 'ROLE', id: deptId, secondaryId: role,
            title: 'Rolü Sil',
            message: `"${role}" rolünü silmek istediğinize emin misiniz?`
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'DEPT' && deleteModal.id) {
            deleteDepartment(deleteModal.id);
        } else if (deleteModal.type === 'ROLE' && deleteModal.id && deleteModal.secondaryId) {
            deleteRoleFromDepartment(deleteModal.id, deleteModal.secondaryId);
        }
        setDeleteModal(prev => ({ ...prev, isOpen: false }));
    };

    if (!isCloudSynced) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                 <div className="p-6 bg-slate-100 rounded-full text-slate-400">
                     <Shield size={48} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-700">Veritabanı Bağlı Değil</h2>
                 <p className="text-slate-500 max-w-md">Departman ve rol verilerini yönetmek için lütfen Supabase kurulumunu tamamlayın.</p>
                 <GlassButton onClick={() => onNavigate(ManagerView.SETUP)}>Kuruluma Git</GlassButton>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <header>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Departman ve Roller</h2>
                </div>
                <p className="text-slate-500">Şirket organizasyon şemanızı tanımlayın.</p>
            </header>

            <GlassCard className="mb-6">
                <form onSubmit={handleAddDept} className="flex gap-4">
                    <GlassInput 
                        placeholder="Yeni Departman Adı (Örn: Pazarlama)" 
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                        className="flex-1"
                    />
                    <GlassButton type="submit">
                        <Plus size={18} /> Ekle
                    </GlassButton>
                </form>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departments.map(dept => (
                    <GlassCard key={dept.id} className="flex flex-col h-full !p-0 overflow-hidden">
                        <div className="p-4 bg-sky-50/50 border-b border-sky-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Folder className="text-sky-500" size={20} />
                                <h3 className="font-bold text-slate-700">{dept.name}</h3>
                            </div>
                            <button onClick={(e) => initiateDeleteDept(e, dept.id)} className="text-slate-400 hover:text-rose-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="p-4 flex-1 space-y-3">
                            <div className="flex gap-2 mb-3">
                                <input 
                                    className="flex-1 bg-white/50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-300 text-slate-700"
                                    placeholder="Rol Ekle..."
                                    value={newRoles[dept.id] || ''}
                                    onChange={e => setNewRoles(prev => ({...prev, [dept.id]: e.target.value}))}
                                    onKeyDown={e => { if(e.key === 'Enter') handleAddRole(dept.id) }}
                                />
                                <button onClick={() => handleAddRole(dept.id)} className="bg-sky-100 text-sky-600 p-1.5 rounded-lg hover:bg-sky-200">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {dept.roles.length === 0 && <p className="text-xs text-slate-400 italic">Henüz rol eklenmedi.</p>}
                                {dept.roles.map((role, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/40 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                                            <span className="text-slate-600">{role}</span>
                                        </div>
                                        <button onClick={(e) => initiateDeleteRole(e, dept.id, role)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <ConfirmationModal 
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                message={deleteModal.message}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal(prev => ({...prev, isOpen: false}))}
            />
        </div>
    );
};

const BalanceRow: React.FC<{ userId: string, balance: LeaveBalance, onUpdate: any }> = ({ userId, balance, onUpdate }) => {
    const [total, setTotal] = useState(balance.total);
    const [used, setUsed] = useState(balance.used);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setTotal(balance.total);
        setUsed(balance.used);
        setIsDirty(false);
    }, [balance]);

    const handleSave = () => {
        onUpdate(userId, balance.type, total, used);
        setIsDirty(false);
    };

    return (
        <tr className="border-b border-slate-100 last:border-0">
            <td className="py-2 text-slate-600 font-medium">{balance.type}</td>
            <td className="py-2">
                <input 
                    type="number" 
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-700"
                    value={total}
                    onChange={e => { setTotal(Number(e.target.value)); setIsDirty(true); }}
                />
            </td>
            <td className="py-2">
                <input 
                    type="number" 
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-700"
                    value={used}
                    onChange={e => { setUsed(Number(e.target.value)); setIsDirty(true); }}
                />
            </td>
            <td className="py-2 text-center text-slate-500 font-bold">
                {total - used}
            </td>
            <td className="py-2 text-right">
                {isDirty && (
                    <button onClick={handleSave} className="text-xs bg-sky-500 text-white px-2 py-1 rounded hover:bg-sky-600 transition-colors">
                        Kaydet
                    </button>
                )}
            </td>
        </tr>
    );
};

const UsersView: React.FC<{onNavigate: (v: ManagerView) => void}> = ({onNavigate}) => {
    const { users, currentUser, isCloudSynced, addUser, updateUser, deleteUser, departments, allBalances, updateUserBalance } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null });
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dept, setDept] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [role, setRole] = useState<Role>(Role.EMPLOYEE);
    const [manager, setManager] = useState('');

    // Filter users who are managers
    const managers = users.filter(u => u.role === Role.MANAGER);

    const openNew = () => {
        setEditingUser(null);
        setName(''); setEmail(''); setDept(''); setJobTitle(''); setRole(Role.EMPLOYEE); setManager('');
        setIsModalOpen(true);
    };

    const openEdit = (user: UserType) => {
        setEditingUser(user);
        setName(user.name); setEmail(user.email); setDept(user.department); setJobTitle(user.jobTitle || ''); setRole(user.role); setManager(user.managerName || '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const userData: UserType = {
            id: editingUser ? editingUser.id : crypto.randomUUID(),
            companyId: currentUser?.companyId || '',
            name, email, role, department: dept, jobTitle, managerName: manager,
            avatarUrl: ''
        };

        if (editingUser) {
            await updateUser(userData);
        } else {
            await addUser(userData);
        }
        setIsModalOpen(false);
    };

    const initiateDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, userId: id });
    };

    const confirmDelete = () => {
        if(deleteModal.userId) {
            deleteUser(deleteModal.userId);
        }
        setDeleteModal({ isOpen: false, userId: null });
    };
    
    // Get available roles based on selected department
    const availableRoles = departments.find(d => d.name === dept)?.roles || [];

    // Get balances for editing user
    const userBalances = editingUser ? (allBalances[editingUser.id] || []) : [];

    if (!isCloudSynced) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                 <div className="p-6 bg-slate-100 rounded-full text-slate-400">
                     <UsersIcon size={48} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-700">Veritabanı Bağlı Değil</h2>
                 <p className="text-slate-500 max-w-md">Çalışan eklemek için lütfen Supabase kurulumunu tamamlayın.</p>
                 <GlassButton onClick={() => onNavigate(ManagerView.SETUP)}>Kuruluma Git</GlassButton>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in relative">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Çalışan Yönetimi</h2>
                    <p className="text-slate-500">Sisteme erişimi olan kullanıcılar.</p>
                </div>
                <GlassButton onClick={openNew}>
                    <Plus size={18} />
                    Çalışan Ekle
                </GlassButton>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <GlassCard key={user.id} className="relative group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <UserAvatar name={user.name} size="md" className="text-slate-800" />
                            <div>
                                <h3 className="font-bold text-slate-700">{user.name}</h3>
                                <div className="flex gap-1 mt-1">
                                     <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wide border border-sky-100 bg-sky-50 rounded px-1.5 py-0.5 inline-block">
                                        {user.role === Role.MANAGER ? 'Yönetici' : 'Çalışan'}
                                    </p>
                                    {user.jobTitle && (
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide border border-indigo-100 bg-indigo-50 rounded px-1.5 py-0.5 inline-block">
                                            {user.jobTitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-500 mb-2">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase size={14} className="text-slate-400" />
                                <span>{user.department}</span>
                            </div>
                        </div>
                        
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                             <button 
                                onClick={() => openEdit(user)}
                                className="p-1.5 text-slate-300 hover:text-sky-500 transition-colors bg-white rounded-full shadow-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                             <button 
                                onClick={(e) => initiateDelete(e, user.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-full shadow-sm"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Çalışan Düzenle' : 'Yeni Çalışan'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <GlassInput placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} required />
                            <GlassInput type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} required />
                            
                            {!editingUser && (
                                <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                    <strong>Not:</strong> İlk şifre otomatik olarak oluşturulacaktır.
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">Sistem Rolü</label>
                                    <GlassSelect value={role} onChange={e => setRole(e.target.value as Role)}>
                                        <option value={Role.EMPLOYEE}>Çalışan</option>
                                        <option value={Role.MANAGER}>Yönetici</option>
                                    </GlassSelect>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">Yönetici</label>
                                    <GlassSelect value={manager} onChange={e => setManager(e.target.value)}>
                                        <option value="">Seçiniz</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </GlassSelect>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">Departman</label>
                                <GlassSelect value={dept} onChange={e => { setDept(e.target.value); setJobTitle(''); }}>
                                    <option value="">Seçiniz</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </GlassSelect>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">Unvan (Rol)</label>
                                <GlassSelect value={jobTitle} onChange={e => setJobTitle(e.target.value)} disabled={!dept}>
                                    <option value="">Seçiniz</option>
                                    {availableRoles.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </GlassSelect>
                            </div>

                            {editingUser && (
                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    <h4 className="font-bold text-slate-700 mb-2">İzin Bakiyeleri</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                                                <th className="pb-2 pl-2">Tür</th>
                                                <th className="pb-2 w-20 text-center">Toplam</th>
                                                <th className="pb-2 w-20 text-center">Kull.</th>
                                                <th className="pb-2 w-20 text-center">Kalan</th>
                                                <th className="pb-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userBalances.map(b => (
                                                <BalanceRow key={b.type} userId={editingUser.id} balance={b} onUpdate={updateUserBalance} />
                                            ))}
                                            {userBalances.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-slate-400 py-2">Bakiye bilgisi bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            
                            <GlassButton type="submit" className="w-full mt-4">Kaydet</GlassButton>
                        </form>
                    </GlassCard>
                </div>
            )}

            <ConfirmationModal 
                isOpen={deleteModal.isOpen}
                title="Kullanıcıyı Sil"
                message="Bu kullanıcıyı ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, userId: null })}
            />
        </div>
    );
};

const PoliciesView: React.FC = () => {
    const { companyPolicy, updateCompanyPolicy, renewYearlyBalances } = useData();
    const [policyForm, setPolicyForm] = useState<CompanyPolicy>(companyPolicy);

    useEffect(() => {
        setPolicyForm(companyPolicy);
    }, [companyPolicy]);

    const handlePolicyUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateCompanyPolicy(policyForm);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
             <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Şirket İzin Politikaları</h2>
                    <p className="text-slate-500">Çalışanların yıllık varsayılan izin haklarını belirleyin.</p>
                </div>
             </header>

             <GlassCard className="p-8">
                 <div className="flex items-start gap-4 mb-8 bg-sky-50 border border-sky-100 p-4 rounded-xl">
                     <AlertCircle className="text-sky-500 shrink-0 mt-1" />
                     <div className="space-y-2">
                         <h4 className="font-bold text-sky-800 text-sm">Nasıl Çalışır?</h4>
                         <p className="text-xs text-sky-700 leading-relaxed">
                             Burada belirlediğiniz izin hakları, sisteme <strong>yeni eklenen</strong> çalışanlara otomatik olarak atanır. 
                             Mevcut çalışanların haklarını bu değerlere göre sıfırlamak için "Yıl Sonu Devri Yap" butonunu kullanabilirsiniz.
                         </p>
                     </div>
                 </div>

                 <form onSubmit={handlePolicyUpdate} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-2">
                             <label className="block text-sm font-bold text-slate-700">Yıllık İzin</label>
                             <div className="relative">
                                <GlassInput 
                                    type="number" 
                                    className="!text-lg font-bold text-sky-600 pl-4 pr-12"
                                    value={policyForm.annual} 
                                    onChange={e => setPolicyForm({...policyForm, annual: Number(e.target.value)})} 
                                    min="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GÜN</span>
                             </div>
                             <p className="text-[10px] text-slate-400">Standart yıllık izin hakkı.</p>
                         </div>
                         <div className="space-y-2">
                             <label className="block text-sm font-bold text-slate-700">Hastalık İzni</label>
                             <div className="relative">
                                <GlassInput 
                                    type="number" 
                                    className="!text-lg font-bold text-rose-500 pl-4 pr-12"
                                    value={policyForm.sick} 
                                    onChange={e => setPolicyForm({...policyForm, sick: Number(e.target.value)})} 
                                    min="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GÜN</span>
                             </div>
                             <p className="text-[10px] text-slate-400">Raporlu/Raporsuz hastalık.</p>
                         </div>
                         <div className="space-y-2">
                             <label className="block text-sm font-bold text-slate-700">Mazeret İzni</label>
                             <div className="relative">
                                <GlassInput 
                                    type="number" 
                                    className="!text-lg font-bold text-emerald-600 pl-4 pr-12"
                                    value={policyForm.casual} 
                                    onChange={e => setPolicyForm({...policyForm, casual: Number(e.target.value)})} 
                                    min="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GÜN</span>
                             </div>
                             <p className="text-[10px] text-slate-400">Kişisel mazeretler için.</p>
                         </div>
                     </div>
                     
                     <div className="border-t border-slate-100 pt-6 flex justify-end">
                         <GlassButton type="submit" className="w-full md:w-auto">Politikayı Kaydet ve Güncelle</GlassButton>
                     </div>
                 </form>
             </GlassCard>

             <div className="mt-10">
                 <h3 className="text-xl font-bold text-slate-700 mb-4">Dönem İşlemleri</h3>
                 <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-l-4 border-indigo-400">
                     <div>
                         <h4 className="font-bold text-indigo-900 mb-1">Yıl Sonu Devri</h4>
                         <p className="text-sm text-slate-600">
                             Tüm çalışanların "Kullanılan" izinlerini sıfırlar ve "Toplam Haklarını" yukarıdaki politika değerlerine göre yeniler.
                         </p>
                     </div>
                     <GlassButton onClick={renewYearlyBalances} variant="neutral" className="shrink-0 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                         <RefreshCw size={16} /> Devir İşlemini Başlat
                     </GlassButton>
                 </GlassCard>
             </div>
        </div>
    );
};

const SettingsView: React.FC = () => {
    const { rules, toggleRule, addRule, updateRule, deleteRule, currentUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutoApprovalRule | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, ruleId: string | null }>({ isOpen: false, ruleId: null });

    // Bot Form State
    const [formType, setFormType] = useState<LeaveType>(LeaveType.ANNUAL);
    const [formMinDays, setFormMinDays] = useState(0);
    const [formMaxDays, setFormMaxDays] = useState(0);
    const [formBalance, setFormBalance] = useState(true);

    const openEdit = (rule: AutoApprovalRule) => {
        setEditingRule(rule);
        setFormType(rule.type);
        setFormMinDays(rule.minDaysNotice);
        setFormMaxDays(rule.maxDuration);
        setFormBalance(rule.requireSufficientBalance);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingRule(null);
        setFormType(LeaveType.ANNUAL);
        setFormMinDays(1);
        setFormMaxDays(3);
        setFormBalance(true);
        setIsModalOpen(true);
    };

    const handleSaveRule = (e: React.FormEvent) => {
        e.preventDefault();
        const ruleData: AutoApprovalRule = {
            id: editingRule ? editingRule.id : Date.now().toString(),
            companyId: currentUser?.companyId || '',
            type: formType,
            minDaysNotice: formMinDays,
            maxDuration: formMaxDays,
            requireSufficientBalance: formBalance,
            enabled: editingRule ? editingRule.enabled : true
        };

        if (editingRule) {
            updateRule(ruleData);
        } else {
            addRule(ruleData);
        }
        setIsModalOpen(false);
    };

    const initiateDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, ruleId: id });
    };

    const confirmDelete = () => {
        if(deleteModal.ruleId) {
            deleteRule(deleteModal.ruleId);
            if(editingRule?.id === deleteModal.ruleId) setIsModalOpen(false);
        }
        setDeleteModal({ isOpen: false, ruleId: null });
    };

    return (
        <div className="space-y-10 animate-fade-in relative">
             <header>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Bot Ayarları</h2>
                <p className="text-slate-500">Otomatik onay sisteminin kurallarını yönetin.</p>
             </header>

             {/* Bot Rules Section */}
             <section>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Settings className="text-indigo-500" size={24} />
                        <h3 className="text-xl font-bold text-slate-700">Onay Kuralları</h3>
                    </div>
                    <GlassButton onClick={openNew} className="!py-2 !px-4 text-sm">
                        <Plus size={16} /> Yeni Kural
                    </GlassButton>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map(rule => (
                        <GlassCard key={rule.id} className={`transition-all duration-300 ${rule.enabled ? 'border-sky-300 ring-1 ring-sky-200' : 'opacity-80'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-700">{rule.type}</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {rule.enabled ? 'Otomasyon Aktif' : 'Manuel Onay'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => initiateDelete(e, rule.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                        title="Kuralı Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => openEdit(rule)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-500 transition-colors"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => toggleRule(rule.id)}
                                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${rule.enabled ? 'bg-sky-400' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Min. Bildirim Süresi:</span>
                                    <span className="font-medium">{rule.minDaysNotice} Gün</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>Max. İzin Süresi:</span>
                                    <span className="font-medium">{rule.maxDuration} Gün</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Bakiye Kontrolü:</span>
                                    <span className={`font-medium ${rule.requireSufficientBalance ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {rule.requireSufficientBalance ? 'Zorunlu' : 'Yok'}
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                 </div>
             </section>

             {/* Modal Overlay for Bot Rules */}
             {isModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                     <GlassCard className="w-full max-w-md animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{editingRule ? 'Kuralı Düzenle' : 'Yeni Kural'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSaveRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">İzin Türü</label>
                                <GlassSelect value={formType} onChange={(e) => setFormType(e.target.value as LeaveType)}>
                                    {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
                                </GlassSelect>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Min. Bildirim (Gün)</label>
                                    <GlassInput type="number" min="0" value={formMinDays} onChange={e => setFormMinDays(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Max. Süre (Gün)</label>
                                    <GlassInput type="number" min="1" value={formMaxDays} onChange={e => setFormMaxDays(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/40">
                                <input 
                                    type="checkbox" 
                                    id="reqBalance"
                                    checked={formBalance} 
                                    onChange={e => setFormBalance(e.target.checked)}
                                    className="w-5 h-5 rounded text-sky-500 focus:ring-sky-400"
                                />
                                <label htmlFor="reqBalance" className="text-sm text-slate-700 font-medium cursor-pointer">Yeterli Bakiye Zorunlu</label>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <GlassButton type="submit" className="flex-1">Kaydet</GlassButton>
                            </div>
                        </form>
                     </GlassCard>
                 </div>
             )}

             <ConfirmationModal 
                 isOpen={deleteModal.isOpen}
                 title="Kuralı Sil"
                 message="Bu kuralı silmek istediğinize emin misiniz?"
                 onConfirm={confirmDelete}
                 onCancel={() => setDeleteModal({ isOpen: false, ruleId: null })}
             />
        </div>
    );
};

const DashboardView: React.FC = () => {
    const { requests, updateRequestStatus, users } = useData();
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        reqId: string | null;
        action: 'approve' | 'reject' | null;
    }>({ isOpen: false, reqId: null, action: null });
    
    // Filter for pending requests
    const pendingRequests = requests.filter(r => r.status === LeaveStatus.PENDING);

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        setConfirmModal({ isOpen: true, reqId: id, action });
    };

    const confirmAction = () => {
        if (confirmModal.reqId && confirmModal.action) {
            updateRequestStatus(confirmModal.reqId, confirmModal.action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED);
        }
        setConfirmModal({ isOpen: false, reqId: null, action: null });
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <header>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">İzin Akışı</h2>
                <p className="text-slate-500">Bekleyen talepleri inceleyin ve yanıtlayın.</p>
             </header>

             {/* Pending Requests */}
             <div className="space-y-4">
                 {pendingRequests.length === 0 ? (
                     <div className="text-center py-20 bg-white/20 rounded-3xl border border-dashed border-slate-300">
                         <div className="text-slate-400 mb-2">Bekleyen talep yok 🎉</div>
                     </div>
                 ) : (
                     pendingRequests.map(req => {
                         const requester = users.find(u => u.id === req.userId);
                         return (
                            <GlassCard key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-white/60 transition-colors">
                                <div className="flex gap-4 items-center">
                                    <UserAvatar name={req.userName} size="md" className="text-slate-800" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-700 text-lg">{req.userName}</h3>
                                            {requester?.jobTitle && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{requester.jobTitle}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-medium text-sky-600">{req.type}</span>
                                            <span>•</span>
                                            <span>{new Date(req.startDate).toLocaleDateString('tr-TR')} - {new Date(req.endDate).toLocaleDateString('tr-TR')}</span>
                                            <span className="bg-slate-100 px-2 rounded text-xs py-0.5">{req.days} Gün</span>
                                        </div>
                                        {req.reason && <p className="text-sm text-slate-400 mt-1 italic">"{req.reason}"</p>}
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => handleAction(req.id, 'reject')}
                                        className="flex-1 md:flex-none flex items-center justify-center w-10 h-10 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
                                        title="Reddet"
                                    >
                                        <X size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, 'approve')}
                                        className="flex-1 md:flex-none flex items-center justify-center w-10 h-10 rounded-full bg-sky-400 text-white shadow-lg shadow-sky-200 hover:bg-sky-500 transition-all active:scale-95"
                                        title="Onayla"
                                    >
                                        <Check size={20} />
                                    </button>
                                </div>
                            </GlassCard>
                         );
                     })
                 )}
             </div>

             <ConfirmationModal 
                 isOpen={confirmModal.isOpen}
                 title={confirmModal.action === 'approve' ? 'Talebi Onayla' : 'Talebi Reddet'}
                 message={`Bu izin talebini ${confirmModal.action === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`}
                 onConfirm={confirmAction}
                 onCancel={() => setConfirmModal({ isOpen: false, reqId: null, action: null })}
                 confirmText={confirmModal.action === 'approve' ? 'Onayla' : 'Reddet'}
                 cancelText="İptal"
             />
        </div>
    );
};

const CalendarView: React.FC = () => {
    const { requests } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Adjust for Monday start (Turkish standard)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i);

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getLeavesForDay = (day: number) => {
        const checkDate = new Date(year, month, day);
        
        return requests.filter(req => {
            if (req.status !== LeaveStatus.APPROVED) return false;
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            // Normalize dates to remove time parts for accurate comparison
            const checkTime = checkDate.setHours(0,0,0,0);
            const startTime = new Date(start).setHours(0,0,0,0);
            const endTime = new Date(end).setHours(0,0,0,0);
            
            return checkTime >= startTime && checkTime <= endTime;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Takvim</h2>
                    <p className="text-slate-500">Çalışan izin durumlarını görüntüleyin.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/50 rounded-xl p-2 border border-white/40">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={20}/></button>
                    <span className="font-bold text-slate-700 min-w-[150px] text-center capitalize">{monthName}</span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronRight size={20}/></button>
                </div>
             </header>

             <GlassCard className="!p-0 overflow-hidden">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 bg-sky-100/30 border-b border-white/30">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                        <div key={d} className="p-4 text-center font-bold text-slate-500 text-sm">{d}</div>
                    ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr bg-white/30">
                    {blanks.map(b => (
                         <div key={`blank-${b}`} className="p-4 min-h-[120px] border-b border-r border-white/20 bg-slate-50/20" />
                    ))}
                    {days.map(day => {
                        const leaves = getLeavesForDay(day);
                        const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                        
                        return (
                            <div key={day} className={`p-2 min-h-[120px] border-b border-r border-white/30 relative transition-colors hover:bg-white/40 ${isWeekend ? 'bg-slate-50/40' : ''}`}>
                                <span className={`text-sm font-semibold mb-2 block ${isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>{day}</span>
                                <div className="space-y-1">
                                    {leaves.map(leave => (
                                        <div key={leave.id} className="text-[10px] bg-sky-200/80 text-sky-800 px-2 py-1 rounded-md border border-sky-300/50 truncate font-medium" title={`${leave.userName} - ${leave.type}`}>
                                            {leave.userName}
                                        </div>
                                    ))}
                                    {leaves.length > 2 && (
                                        <div className="text-[10px] text-slate-400 pl-1">+ {leaves.length - 2} kişi daha</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
             </GlassCard>
        </div>
    );
};

const AnalyticsView: React.FC = () => {
    const { requests } = useData();
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Dynamic Logic for Charts
    const annualCount = requests.filter(r => r.type.includes('Yıllık')).length;
    const sickCount = requests.filter(r => r.type.includes('Hastalık')).length;
    const casualCount = requests.filter(r => r.type.includes('Mazeret')).length;
    const otherCount = requests.length - (annualCount + sickCount + casualCount);

    const pieData = [
        { name: 'Yıllık', value: annualCount, color: '#38bdf8' }, // sky-400
        { name: 'Hastalık', value: sickCount, color: '#fb7185' }, // rose-400
        { name: 'Mazeret', value: casualCount, color: '#34d399' }, // emerald-400
        { name: 'Diğer', value: otherCount, color: '#94a3b8' }, // slate-400
    ].filter(d => d.value > 0);

    const getAIInsight = async () => {
        setLoading(true);
        const result = await generateLeaveInsights(requests); 
        setInsight(result);
        setLoading(false);
    };

    const downloadExcel = () => {
        const headers = ["Ad Soyad,Departman,Izin Turu,Baslangic,Bitis,Gun,Durum,Gerekce"];
        const rows = requests.map(r => 
            `"${r.userName}","Yazılım","${r.type}","${r.startDate}","${r.endDate}",${r.days},"${r.status}","${r.reason}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `shift_free_rapor_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Analizler</h2>
                    <p className="text-slate-500">Departman izin kullanım istatistikleri.</p>
                </div>
                <div className="flex gap-2">
                    <GlassButton onClick={downloadExcel} className="!py-2 !px-4 text-sm bg-emerald-500/80 hover:bg-emerald-500 shadow-emerald-200/50" variant="success">
                        <Download size={16} />
                        Excel İndir
                    </GlassButton>
                    <GlassButton onClick={getAIInsight} className="!py-2 !px-4 text-sm" disabled={loading}>
                        <Sparkles size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Analiz Ediliyor...' : 'Gemini Analizi'}
                    </GlassButton>
                </div>
            </div>

            {insight && (
                <GlassCard className="bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-100">
                    <div className="flex gap-3">
                        <Sparkles className="text-sky-500 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-sky-800 mb-1">AI Öngörüsü</h4>
                            <p className="text-slate-700 text-sm leading-relaxed">{insight}</p>
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="min-h-[350px] flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-6">İzin Türü Dağılımı</h3>
                    {pieData.length > 0 ? (
                        <div className="flex-1 w-full min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                         <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Veri yok</div>
                    )}
                </GlassCard>

                <GlassCard className="min-h-[350px] flex flex-col justify-center items-center">
                    <h3 className="font-bold text-slate-700 mb-2">Aylık Talep Yoğunluğu</h3>
                    <p className="text-sm text-slate-400">Veriler biriktikçe grafik oluşacaktır.</p>
                </GlassCard>
            </div>
        </div>
    );
};