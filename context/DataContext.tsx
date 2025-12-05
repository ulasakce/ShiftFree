import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LeaveRequest, LeaveBalance, AutoApprovalRule, Role, LeaveStatus, LeaveType, Department, CompanyPolicy, Company } from '../types';
import * as XLSX from 'xlsx';
import { createClientFromStored, createNewClient, storeCredentials, clearCredentials } from '../services/supabaseService';
import { SupabaseClient } from '@supabase/supabase-js';

interface DataContextType {
  currentUser: User | null;
  currentCompany: Company | null;
  users: User[];
  requests: LeaveRequest[];
  myBalances: LeaveBalance[];
  allBalances: Record<string, LeaveBalance[]>;
  rules: AutoApprovalRule[];
  departments: Department[];
  companyPolicy: CompanyPolicy;
  isCloudSynced: boolean;
  cloudExcelUrl: string | null;
  refreshData: () => Promise<void>;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  registerAdmin: (name: string, email: string, password: string, companyName: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addRequest: (req: LeaveRequest) => void;
  deleteRequest: (id: string) => void;
  updateRequestStatus: (id: string, status: LeaveStatus) => void;
  toggleRule: (id: string) => void;
  addRule: (rule: AutoApprovalRule) => void;
  updateRule: (rule: AutoApprovalRule) => void;
  deleteRule: (id: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  updateUserBalance: (userId: string, type: LeaveType, total: number, used: number) => Promise<void>;
  deleteUser: (id: string) => void;
  updateProfile: (name: string, password?: string) => Promise<{ success: boolean; message: string }>;
  addDepartment: (name: string) => void;
  deleteDepartment: (id: string) => void;
  addRoleToDepartment: (deptId: string, roleName: string) => void;
  deleteRoleFromDepartment: (deptId: string, roleName: string) => void;
  updateCompanyPolicy: (policy: CompanyPolicy) => Promise<void>;
  renewYearlyBalances: () => Promise<void>;
  bulkImport: (importedUsers: User[], importedRequests: LeaveRequest[]) => void;
  syncFromCloud: (url: string, key?: string) => Promise<{success: boolean, message?: string}>;
  syncFromFile: (file: File) => Promise<{success: boolean, message?: string}>;
  exportDatabaseToExcel: () => void;
  disconnectCloud: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(createClientFromStored());
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allBalances, setAllBalances] = useState<Record<string, LeaveBalance[]>>({});
  const [rules, setRules] = useState<AutoApprovalRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companyPolicy, setCompanyPolicy] = useState<CompanyPolicy>({ annual: 14, sick: 10, casual: 5 });
  
  // We use this to indicate if DB is connected
  const isCloudSynced = !!supabase;

  const myBalances = currentUser ? (allBalances[currentUser.id] || []) : [];

  const getDefaultBalances = useCallback((): LeaveBalance[] => [
      { type: LeaveType.ANNUAL, total: companyPolicy.annual, used: 0, remaining: companyPolicy.annual },
      { type: LeaveType.CASUAL, total: companyPolicy.casual, used: 0, remaining: companyPolicy.casual },
      { type: LeaveType.SICK, total: companyPolicy.sick, used: 0, remaining: companyPolicy.sick },
  ], [companyPolicy]);

  // --- SUPABASE DATA FETCHING ---
  const fetchData = useCallback(async () => {
      if (!supabase || !currentUser) return;

      try {
        // Fetch Company Info if not set
        if (!currentCompany) {
             const { data: compData } = await supabase.from('companies').select('*').eq('id', currentUser.companyId).single();
             if (compData) setCurrentCompany({ id: compData.id, name: compData.name });
        }

        const companyId = currentUser.companyId;

        // 1. Fetch Users (Filtered by Company)
        const { data: usersData, error: userError } = await supabase.from('users').select('*').eq('company_id', companyId);
        if (userError) throw userError;
        if (usersData) {
            const mappedUsers: User[] = usersData.map((u: any) => ({
                id: u.id,
                companyId: u.company_id,
                name: u.name,
                email: u.email,
                role: u.role as Role,
                department: u.department || '',
                jobTitle: u.job_title || '',
                managerName: u.manager_name || '',
                avatarUrl: u.avatar_url || '',
                companyName: u.company_name || ''
            }));
            setUsers(mappedUsers);
        }

        // 2. Fetch Requests (Filtered by Company)
        const { data: requestsData, error: reqError } = await supabase.from('leave_requests').select('*').eq('company_id', companyId);
        if (reqError) throw reqError;
        if (requestsData) {
            const mappedRequests: LeaveRequest[] = requestsData.map((r: any) => ({
                id: r.id,
                companyId: r.company_id,
                userId: r.user_id,
                userName: r.user_name,
                type: r.type as LeaveType,
                startDate: r.start_date,
                endDate: r.end_date,
                days: r.days,
                reason: r.reason,
                status: r.status as LeaveStatus,
                requestedAt: r.requested_at
            }));
            setRequests(mappedRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
        }

        // 3. Fetch Balances (Filtered by Company)
        const { data: balanceData } = await supabase.from('leave_balances').select('*').eq('company_id', companyId);
        if (balanceData) {
            const balancesMap: Record<string, LeaveBalance[]> = {};
            balanceData.forEach((b: any) => {
                if (!balancesMap[b.user_id]) balancesMap[b.user_id] = [];
                balancesMap[b.user_id].push({
                    id: b.id,
                    companyId: b.company_id,
                    type: b.type as LeaveType,
                    total: b.total,
                    used: b.used,
                    remaining: b.remaining
                });
            });
            setAllBalances(balancesMap);
        }

        // 4. Fetch Rules (Filtered by Company)
        const { data: rulesData } = await supabase.from('auto_approval_rules').select('*').eq('company_id', companyId);
        if (rulesData) {
            const mappedRules: AutoApprovalRule[] = rulesData.map((r: any) => ({
                id: r.id,
                companyId: r.company_id,
                type: r.type as LeaveType,
                enabled: r.enabled,
                minDaysNotice: r.min_days_notice,
                maxDuration: r.max_duration,
                requireSufficientBalance: r.require_sufficient_balance
            }));
            setRules(mappedRules);
        }

        // 5. Fetch Departments (Filtered by Company)
        const { data: deptData } = await supabase.from('departments').select('*').eq('company_id', companyId);
        if (deptData) {
            setDepartments(deptData.map((d: any) => ({
                id: d.id,
                companyId: d.company_id,
                name: d.name,
                roles: d.roles
            })));
        }

        // 6. Fetch Company Policy (Filtered by Company)
        try {
            const { data: policyData } = await supabase.from('company_policies').select('*').eq('company_id', companyId).single();
            if (policyData) {
                setCompanyPolicy({
                    id: policyData.id,
                    companyId: policyData.company_id,
                    annual: policyData.annual,
                    sick: policyData.sick,
                    casual: policyData.casual
                });
            } else {
                 // Initialize defaults for this company if missing
                 const { error: polErr } = await supabase.from('company_policies').insert({
                     id: crypto.randomUUID(),
                     company_id: companyId,
                     annual: 14, sick: 10, casual: 5
                 });
                 if (!polErr) fetchData(); // Retry
            }
        } catch (e) {
            console.warn("Could not fetch policies, using defaults.");
        }

      } catch (error) {
          console.error("Error fetching data from Supabase:", error);
      }

  }, [supabase, currentUser, currentCompany]);

  useEffect(() => {
      fetchData();
      
      // Real-time Subscription (Filtered by tenant if RLS was strict, but here we listen to public schema and filter in fetch)
      if (supabase) {
        const channel = supabase
          .channel('public:all')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
             fetchData();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
  }, [supabase, fetchData]);

  // Actions
  const login = async (email: string, password: string, role: Role): Promise<boolean> => {
    if (!supabase) return false;
    
    // Check email, role AND password
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .eq('password', password)
        .single();
    
    if (userData && !error) {
        const user: User = {
            id: userData.id,
            companyId: userData.company_id,
            name: userData.name,
            email: userData.email,
            role: userData.role as Role,
            department: userData.department || '',
            jobTitle: userData.job_title || '',
            managerName: userData.manager_name || '',
            avatarUrl: userData.avatar_url || '',
            companyName: userData.company_name || ''
        };
        setCurrentUser(user);
        // fetchData will trigger due to currentUser dependency
        return true;
    }
    return false;
  };

  const registerAdmin = async (name: string, email: string, password: string, companyName: string): Promise<{ success: boolean; message?: string }> => {
      if (!supabase) return { success: false, message: "Veritabanı bağlantısı yok." };

      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
      if (existingUser) {
          return { success: false, message: "Bu e-posta adresi zaten kayıtlı." };
      }

      // 1. Create Company
      const { data: companyData, error: companyError } = await supabase.from('companies').insert({
          name: companyName
      }).select().single();

      if (companyError || !companyData) return { success: false, message: "Şirket oluşturulamadı: " + companyError?.message };

      const companyId = companyData.id;
      const newUserId = crypto.randomUUID();

      // 2. Create Admin User Linked to Company with Password
      const { error: userError } = await supabase.from('users').insert({
          id: newUserId,
          company_id: companyId,
          name: name,
          email: email,
          password: password, // Store password
          role: Role.MANAGER,
          department: 'Yönetim',
          job_title: 'Admin',
          company_name: companyName
      });

      if (userError) return { success: false, message: userError.message };

      // 3. Create Default Balances
      const defaultBalances = getDefaultBalances();
      const balanceInserts = defaultBalances.map(b => ({
          user_id: newUserId,
          company_id: companyId,
          type: b.type,
          total: b.total,
          used: b.used,
          remaining: b.remaining
      }));

      await supabase.from('leave_balances').insert(balanceInserts);
      
      // 4. Create Default Policy
      await supabase.from('company_policies').insert({ 
          id: crypto.randomUUID(), 
          company_id: companyId, 
          annual: 14, sick: 10, casual: 5 
      });

      // Auto login
      await login(email, password, Role.MANAGER);
      return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  const addUser = async (newUser: User) => {
      if (!supabase || !currentUser) return;
      try {
        // Generate Default Password: CompanyName + CurrentYear (e.g., Acme2024)
        const currentYear = new Date().getFullYear();
        // Remove spaces from company name for cleaner password if desired, or keep as is.
        // Prompt says "companyname+currently year".
        const defaultPassword = `${currentUser.companyName}${currentYear}`;

        const { error } = await supabase.from('users').insert({
            id: newUser.id,
            company_id: currentUser.companyId,
            name: newUser.name,
            email: newUser.email,
            password: defaultPassword, // Insert generated password
            role: newUser.role,
            department: newUser.department,
            job_title: newUser.jobTitle,
            manager_name: newUser.managerName,
            avatar_url: newUser.avatarUrl,
            company_name: currentUser.companyName
        });

        if (error) throw error;

        const balances = getDefaultBalances().map(b => ({
            user_id: newUser.id,
            company_id: currentUser.companyId,
            type: b.type,
            total: b.total,
            used: b.used,
            remaining: b.remaining
        }));
        await supabase.from('leave_balances').insert(balances);
        await fetchData();
        
        alert(`Kullanıcı başarıyla eklendi.\nGeçici Şifre: ${defaultPassword}`);
      } catch (error: any) {
        console.error("Add user error:", error);
        alert("Kullanıcı eklenirken hata oluştu: " + error.message);
      }
  };

  const updateUser = async (updatedUser: User) => {
      if (!supabase) return;
      try {
        const { error } = await supabase.from('users').update({
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            job_title: updatedUser.jobTitle,
            manager_name: updatedUser.managerName
        }).eq('id', updatedUser.id);
        
        if (error) throw error;
        await fetchData();
      } catch (error: any) {
        console.error("Update user error:", error);
        alert("Güncelleme hatası: " + error.message);
      }
  };

  const updateProfile = async (name: string, password?: string): Promise<{ success: boolean; message: string }> => {
      if (!supabase || !currentUser) return { success: false, message: "Oturum hatası" };

      try {
          const updates: any = { name };
          if (password && password.length > 0) {
              updates.password = password;
          }

          const { error } = await supabase.from('users').update(updates).eq('id', currentUser.id);
          if (error) throw error;
          
          // Update local state
          setCurrentUser({ ...currentUser, name });
          return { success: true, message: "Profil başarıyla güncellendi." };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };

  const updateUserBalance = async (userId: string, type: LeaveType, total: number, used: number) => {
    if (!supabase) return;
    try {
        const remaining = total - used;
        const { error } = await supabase.from('leave_balances')
            .update({ total, used, remaining })
            .eq('user_id', userId)
            .eq('type', type);
        
        if (error) throw error;
        await fetchData();
    } catch (e: any) {
        alert("Bakiye güncellenirken hata: " + e.message);
    }
  };

  const deleteUser = async (id: string) => {
      if (!supabase) return;
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (error: any) {
        console.error("Delete user error:", error);
        alert("Kullanıcı silinirken hata (bağlı veriler olabilir): " + error.message);
      }
  };

  const addDepartment = async (name: string) => {
      if (!supabase || !currentUser) return;
      try {
        const { error } = await supabase.from('departments').insert({
            id: crypto.randomUUID(),
            company_id: currentUser.companyId,
            name: name,
            roles: []
        });
        if (error) throw error;
        await fetchData();
      } catch (error: any) {
          alert("Departman ekleme hatası: " + error.message);
      }
  };

  const deleteDepartment = async (id: string) => {
       if (!supabase) return;
       try {
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
       } catch (error: any) {
           alert("Departman silme hatası: " + error.message);
       }
  };

  const addRoleToDepartment = async (deptId: string, roleName: string) => {
      const dept = departments.find(d => d.id === deptId);
      if (!dept || !supabase) return;
      
      const newRoles = [...dept.roles, roleName];
      await supabase.from('departments').update({ roles: newRoles }).eq('id', deptId);
      await fetchData();
  };

  const deleteRoleFromDepartment = async (deptId: string, roleName: string) => {
       const dept = departments.find(d => d.id === deptId);
      if (!dept || !supabase) return;
      
      const newRoles = dept.roles.filter(r => r !== roleName);
      await supabase.from('departments').update({ roles: newRoles }).eq('id', deptId);
      await fetchData();
  };

  const updateCompanyPolicy = async (policy: CompanyPolicy) => {
      if (!supabase || !currentUser) return;
      try {
          const { data: existing } = await supabase.from('company_policies').select('id').eq('company_id', currentUser.companyId).single();
          
          let error;
          if (existing) {
               const { error: err } = await supabase.from('company_policies').update({
                   annual: policy.annual,
                   sick: policy.sick,
                   casual: policy.casual
               }).eq('id', existing.id);
               error = err;
          } else {
               const { error: err } = await supabase.from('company_policies').insert({
                   id: crypto.randomUUID(),
                   company_id: currentUser.companyId,
                   annual: policy.annual,
                   sick: policy.sick,
                   casual: policy.casual
               });
               error = err;
          }

          if (error) throw error;

          // Propagate to users within the company
          const { data: balances, error: balError } = await supabase.from('leave_balances').select('*').eq('company_id', currentUser.companyId);
          if(balError) throw balError;

          if (balances && balances.length > 0) {
              const updates = balances.map((b: any) => {
                  let newTotal = b.total;
                  if (b.type === LeaveType.ANNUAL) newTotal = policy.annual;
                  if (b.type === LeaveType.SICK) newTotal = policy.sick;
                  if (b.type === LeaveType.CASUAL) newTotal = policy.casual;

                  return {
                      id: b.id,
                      company_id: b.company_id, // ensure company_id is preserved
                      user_id: b.user_id,
                      type: b.type,
                      total: newTotal,
                      used: b.used,
                      remaining: newTotal - b.used 
                  };
              });

              const { error: upError } = await supabase.from('leave_balances').upsert(updates);
              if (upError) throw upError;
          }

          await fetchData();
          alert("Şirket politikası güncellendi ve tüm çalışanlara uygulandı.");
      } catch (e: any) {
          alert("Politika güncellenirken hata: " + e.message);
      }
  };

  const renewYearlyBalances = async () => {
    if (!supabase || !currentUser) return;
    if (!window.confirm("Tüm çalışanların izin hakları şirket politikasına göre yenilenecek ve kullanılan izinler sıfırlanacak. Onaylıyor musunuz?")) return;

    try {
        const { data: balances, error } = await supabase.from('leave_balances').select('*').eq('company_id', currentUser.companyId);
        if (error) throw error;

        const updates = balances.map((b: any) => {
            let newTotal = b.total;
            if (b.type === LeaveType.ANNUAL) newTotal = companyPolicy.annual;
            if (b.type === LeaveType.SICK) newTotal = companyPolicy.sick;
            if (b.type === LeaveType.CASUAL) newTotal = companyPolicy.casual;
            
            return {
                id: b.id,
                company_id: b.company_id,
                user_id: b.user_id,
                type: b.type,
                total: newTotal,
                used: 0,
                remaining: newTotal
            };
        });

        const { error: upError } = await supabase.from('leave_balances').upsert(updates);
        if (upError) throw upError;

        alert("Yıl sonu devri başarıyla tamamlandı.");
        await fetchData();
    } catch (e: any) {
        alert("Devir işlemi hatası: " + e.message);
    }
  };

  const adjustBalance = async (userId: string, type: LeaveType, days: number, operation: 'deduct' | 'refund') => {
      if (!supabase) return;

      const { data: currentBalance } = await supabase.from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .single();
      
      if (currentBalance) {
          const newUsed = operation === 'deduct' ? currentBalance.used + days : currentBalance.used - days;
          const newRemaining = currentBalance.total - newUsed;
          
          await supabase.from('leave_balances').update({
              used: newUsed,
              remaining: newRemaining
          }).eq('id', currentBalance.id);
      }
  };

  // --- BOT LOGIC ---
  const evaluateBotDecision = useCallback((req: LeaveRequest, currentRequests: LeaveRequest[], currentRules: AutoApprovalRule[], userBalances: LeaveBalance[]): { status: LeaveStatus, reason?: string } => {
      const activeRule = currentRules.find(r => r.type === req.type && r.enabled);
      
      // If no active bot rule, it remains Pending for manager
      if (!activeRule) {
          return { status: LeaveStatus.PENDING };
      }

      // 1. Balance Check
      if (activeRule.requireSufficientBalance) {
          const balance = userBalances.find(b => b.type === req.type);
          const remaining = balance ? balance.remaining : 0;
          if (remaining < req.days) {
              return { status: LeaveStatus.REJECTED, reason: "Yetersiz bakiye (Bot)" };
          }
      }

      // 2. Duration Check
      if (req.days > activeRule.maxDuration) {
          return { status: LeaveStatus.REJECTED, reason: `Süre sınırı aşıldı: Max ${activeRule.maxDuration} gün (Bot)` };
      }

      // 3. Notice Check
      const start = new Date(req.startDate);
      start.setHours(0,0,0,0);
      const requested = new Date(req.requestedAt);
      requested.setHours(0,0,0,0);
      
      const diffTime = start.getTime() - requested.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (diffDays < activeRule.minDaysNotice) {
          return { status: LeaveStatus.REJECTED, reason: `Erken bildirim: En az ${activeRule.minDaysNotice} gün önce (Bot)` };
      }

      // 4. Conflict Check (Team Availability)
      const requestingUser = users.find(u => u.id === req.userId);
      if (requestingUser && requestingUser.jobTitle) {
           const reqStart = start.getTime();
           const reqEnd = new Date(req.endDate).setHours(0,0,0,0);

           const hasConflict = currentRequests.some(r => {
               if (r.id === req.id) return false; 
               if (r.status !== LeaveStatus.APPROVED) return false;
               if (r.userId === req.userId) return false; 
               
               const otherUser = users.find(u => u.id === r.userId);
               if (!otherUser || otherUser.jobTitle !== requestingUser.jobTitle) return false;

               const rStart = new Date(r.startDate).setHours(0,0,0,0);
               const rEnd = new Date(r.endDate).setHours(0,0,0,0);
               
               return (reqStart <= rEnd && reqEnd >= rStart);
           });

           if (hasConflict) {
               return { status: LeaveStatus.REJECTED, reason: "Takım çakışması: Aynı unvanda izinli personel var (Bot)" };
           }
      }

      // If all passed
      return { status: LeaveStatus.APPROVED, reason: "Otomatik Onay (Bot)" };

  }, [users]);

  const addRequest = async (req: LeaveRequest) => {
    if (!supabase || !currentUser) return;
    try {
        // Get decision immediately
        const userBalances = allBalances[req.userId] || [];
        const decision = evaluateBotDecision(req, requests, rules, userBalances);
        
        const finalStatus = decision.status;

        const { error } = await supabase.from('leave_requests').insert({
            id: req.id,
            company_id: currentUser.companyId,
            user_id: req.userId,
            user_name: req.userName,
            type: req.type,
            start_date: req.startDate,
            end_date: req.endDate,
            days: req.days,
            reason: req.reason,
            status: finalStatus,
            requested_at: req.requestedAt
        });
        if (error) throw error;

        if (finalStatus === LeaveStatus.APPROVED) {
            await adjustBalance(req.userId, req.type, req.days, 'deduct');
            alert("Bot Kararı: ONAYLANDI ✅\nİzin talebiniz kriterlere uygun olduğu için otomatik olarak onaylandı.");
        } else if (finalStatus === LeaveStatus.REJECTED) {
            alert(`Bot Kararı: REDDEDİLDİ ❌\nSebep: ${decision.reason || 'Kriterlere uygun değil'}.`);
        } else {
             alert("Talebiniz alınmıştır. Yönetici onayı bekleniyor.");
        }

        await fetchData();
    } catch (e: any) {
        alert("Talep oluşturulurken hata: " + e.message);
    }
  };

  const deleteRequest = async (id: string) => {
      if (!supabase) return;
      try {
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (error: any) {
          alert("Talep silinirken hata: " + error.message);
      }
  };

  const updateRequestStatus = async (id: string, status: LeaveStatus) => {
    if (!supabase) return;
    try {
        const request = requests.find(r => r.id === id);
        let targetRequest = request;
        if (!targetRequest) {
            const { data } = await supabase.from('leave_requests').select('*').eq('id', id).single();
            if (data) targetRequest = {
                id: data.id, companyId: data.company_id, userId: data.user_id, userName: data.user_name, type: data.type, startDate: data.start_date, endDate: data.end_date, days: data.days, reason: data.reason, status: data.status, requestedAt: data.requested_at
            };
        }

        if (!targetRequest) return;

        const previousStatus = targetRequest.status;
        
        const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
        if (error) throw error;

        if (status === LeaveStatus.APPROVED && previousStatus !== LeaveStatus.APPROVED) {
            await adjustBalance(targetRequest.userId, targetRequest.type, targetRequest.days, 'deduct');
        }
        else if (status === LeaveStatus.REJECTED && previousStatus === LeaveStatus.APPROVED) {
            await adjustBalance(targetRequest.userId, targetRequest.type, targetRequest.days, 'refund');
        }
        else if (status === LeaveStatus.PENDING && previousStatus === LeaveStatus.APPROVED) {
            await adjustBalance(targetRequest.userId, targetRequest.type, targetRequest.days, 'refund');
        }
        await fetchData();
    } catch (e: any) {
        alert("Durum güncellenirken hata: " + e.message);
    }
  };

  // --- CONFIG / SYNC ---
  const bulkImport = async () => {};
  
  const syncFromCloud = async (url: string, key?: string) => { return { success: false } };

  const syncFromFile = async (file: File) => {
        if (!supabase || !currentUser) return { success: false, message: "Veritabanı bağlı değil." };

        return new Promise<{ success: boolean; message?: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });

                    const workerSheetName = 'worker';
                    const dayoffSheetName = 'dayoff';

                    if (!workbook.SheetNames.includes(workerSheetName) || !workbook.SheetNames.includes(dayoffSheetName)) {
                         resolve({ success: false, message: `Excel dosyasında '${workerSheetName}' ve '${dayoffSheetName}' sayfaları bulunamadı.` });
                         return;
                    }

                    // 1. PROCESS USERS
                    const workerSheet = workbook.Sheets[workerSheetName];
                    const workers: any[] = XLSX.utils.sheet_to_json(workerSheet);
                    let userCount = 0;
                    const currentYear = new Date().getFullYear();
                    const defaultPassword = `${currentUser.companyName}${currentYear}`;

                    for (const row of workers) {
                        const email = row['email'] || row['Email'];
                        if (!email) continue;
                        
                        let userId = crypto.randomUUID();
                        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
                        if (existingUser) userId = existingUser.id;

                        const userData: any = {
                            id: userId,
                            company_id: currentUser.companyId, // INJECT COMPANY ID
                            name: row['name'] || row['Name'] || row['Ad Soyad'],
                            email: email,
                            role: (row['role'] === 'MANAGER' || row['Rol'] === 'Yönetici') ? Role.MANAGER : Role.EMPLOYEE,
                            department: row['department'] || row['Departman'],
                            job_title: row['job_title'] || row['title'] || row['Unvan'],
                            manager_name: row['manager'] || row['manager_name'] || row['Yonetici'],
                            avatar_url: '',
                            company_name: currentUser.companyName
                        };
                        
                        if (!existingUser) {
                            userData.password = defaultPassword;
                        }

                        const { error: uError } = await supabase.from('users').upsert(userData);
                        if (!uError) {
                            userCount++;
                            if (!existingUser) {
                                const balances = getDefaultBalances().map(b => ({
                                    user_id: userId,
                                    company_id: currentUser.companyId,
                                    type: b.type,
                                    total: b.total,
                                    used: b.used,
                                    remaining: b.remaining
                                }));
                                await supabase.from('leave_balances').insert(balances);
                            }
                        }
                    }

                    // 2. PROCESS LEAVES
                    const dayoffSheet = workbook.Sheets[dayoffSheetName];
                    const leaves: any[] = XLSX.utils.sheet_to_json(dayoffSheet);
                    let leaveCount = 0;

                    for (const row of leaves) {
                        const email = row['email'] || row['Email'];
                        if (!email) continue;

                        const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
                        if (!user) continue;

                        const leaveData = {
                            id: crypto.randomUUID(),
                            company_id: currentUser.companyId, // INJECT COMPANY ID
                            user_id: user.id,
                            user_name: user.name,
                            type: row['type'] || row['Type'] || row['Tur'],
                            start_date: row['start_date'] || row['Start'] || row['Baslangic'],
                            end_date: row['end_date'] || row['End'] || row['Bitis'],
                            days: Number(row['days'] || row['Days'] || row['Gun']),
                            reason: row['reason'] || row['Reason'] || row['Gerekce'],
                            status: row['status'] === 'Approved' ? LeaveStatus.APPROVED : (row['status'] === 'Rejected' ? LeaveStatus.REJECTED : LeaveStatus.PENDING),
                            requested_at: new Date().toISOString().split('T')[0]
                        };
                        
                        const { error: lError } = await supabase.from('leave_requests').insert(leaveData);
                        if (!lError) leaveCount++;
                    }

                    await fetchData();
                    resolve({ success: true, message: `${userCount} kullanıcı ve ${leaveCount} izin talebi aktarıldı. Varsayılan şifre: ${defaultPassword}` });

                } catch (e: any) {
                    console.error(e);
                    resolve({ success: false, message: "Dosya işleme hatası: " + e.message });
                }
            };
            reader.readAsBinaryString(file);
        });
  };
  
  const disconnectCloud = () => {
      clearCredentials();
      setSupabase(null);
      setCurrentUser(null);
  };

  const exportDatabaseToExcel = () => {
      const wb = XLSX.utils.book_new();
      const userHeaders = [['Ad Soyad', 'Email', 'Rol', 'Departman', 'Unvan', 'Yonetici']];
      const userData = users.map(u => [u.name, u.email, u.role, u.department, u.jobTitle, u.managerName]);
      const wsUsers = XLSX.utils.aoa_to_sheet([...userHeaders, ...userData]);
      XLSX.utils.book_append_sheet(wb, wsUsers, "worker");
      XLSX.writeFile(wb, "ShiftFree_Yedek.xlsx");
  };

  const runBotCheck = useCallback(async () => {
      if (!supabase || !currentUser) return;
      
      const { data: pendingReqs } = await supabase.from('leave_requests').select('*').eq('status', LeaveStatus.PENDING).eq('company_id', currentUser.companyId);
      if (!pendingReqs || pendingReqs.length === 0) return;

      const { data: allReqs } = await supabase.from('leave_requests').select('*').eq('company_id', currentUser.companyId);
      if (!allReqs) return;
      
      const { data: allBals } = await supabase.from('leave_balances').select('*').eq('company_id', currentUser.companyId);

      const mappedReqs: LeaveRequest[] = allReqs.map((r: any) => ({
         id: r.id, companyId: r.company_id, userId: r.user_id, userName: r.user_name, type: r.type, startDate: r.start_date, endDate: r.end_date,
         days: r.days, reason: r.reason, status: r.status, requestedAt: r.requested_at
      }));
      
      const mappedBals: Record<string, LeaveBalance[]> = {};
      allBals?.forEach((b:any) => {
          if (!mappedBals[b.user_id]) mappedBals[b.user_id] = [];
          mappedBals[b.user_id].push({
               id: b.id, companyId: b.company_id, type: b.type, total: b.total, used: b.used, remaining: b.remaining
          });
      });

      const pendingMapped = mappedReqs.filter(r => r.status === LeaveStatus.PENDING);
      let changesMade = false;

      for (const req of pendingMapped) {
          const uBals = mappedBals[req.userId] || [];
          const decision = evaluateBotDecision(req, mappedReqs, rules, uBals);

          if (decision.status !== LeaveStatus.PENDING) {
               const { error } = await supabase.from('leave_requests').update({ status: decision.status }).eq('id', req.id);
               if (!error) {
                   if (decision.status === LeaveStatus.APPROVED) {
                       await adjustBalance(req.userId, req.type, req.days, 'deduct');
                       
                       const reqInList = mappedReqs.find(r => r.id === req.id);
                       if (reqInList) reqInList.status = LeaveStatus.APPROVED;

                       const bal = uBals.find(b => b.type === req.type);
                       if (bal) {
                           bal.used += req.days;
                           bal.remaining -= req.days;
                       }
                   } else if (decision.status === LeaveStatus.REJECTED) {
                       const reqInList = mappedReqs.find(r => r.id === req.id);
                       if (reqInList) reqInList.status = LeaveStatus.REJECTED;
                   }
                   changesMade = true;
               }
          }
      }
      
      if (changesMade) {
          await fetchData();
      }

  }, [supabase, evaluateBotDecision, rules, currentUser]);

  useEffect(() => {
      const intervalId = setInterval(() => {
          runBotCheck();
      }, 30 * 1000); // Check every 30 seconds
      return () => clearInterval(intervalId);
  }, [runBotCheck]);

  const toggleRule = async (id: string) => {
    if (!supabase) return;
    const rule = rules.find(r => r.id === id);
    if(rule) await supabase.from('auto_approval_rules').update({ enabled: !rule.enabled }).eq('id', id);
    await fetchData();
  };

  const addRule = async (rule: AutoApprovalRule) => {
    if (!supabase || !currentUser) return;
    try {
        const { error } = await supabase.from('auto_approval_rules').insert({
            id: rule.id,
            company_id: currentUser.companyId,
            type: rule.type,
            enabled: rule.enabled,
            min_days_notice: rule.minDaysNotice,
            max_duration: rule.maxDuration,
            require_sufficient_balance: rule.requireSufficientBalance
        });
        if (error) throw error;
        await fetchData();
    } catch (e: any) {
        alert("Kural eklenirken hata: " + e.message);
    }
  };

  const updateRule = async (rule: AutoApprovalRule) => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('auto_approval_rules').update({
            min_days_notice: rule.minDaysNotice,
            max_duration: rule.maxDuration,
            require_sufficient_balance: rule.requireSufficientBalance
        }).eq('id', rule.id);
        if (error) throw error;
        await fetchData();
    } catch (e: any) {
        alert("Kural güncellenirken hata: " + e.message);
    }
  };

  const deleteRule = async (id: string) => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('auto_approval_rules').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    } catch (e: any) {
        alert("Kural silinirken hata: " + e.message);
    }
  };

  return (
    <DataContext.Provider value={{
      currentUser, currentCompany, users, requests, myBalances, allBalances, rules, departments, companyPolicy,
      isCloudSynced, cloudExcelUrl: isCloudSynced ? 'Supabase Bağlı' : null,
      refreshData: fetchData,
      login, registerAdmin, logout, addRequest, deleteRequest, updateRequestStatus,
      toggleRule, addRule, updateRule, deleteRule,
      addUser, updateUser, updateUserBalance, deleteUser, updateProfile,
      addDepartment, deleteDepartment, addRoleToDepartment, deleteRoleFromDepartment,
      updateCompanyPolicy, renewYearlyBalances,
      bulkImport, syncFromCloud, syncFromFile, exportDatabaseToExcel, disconnectCloud
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};