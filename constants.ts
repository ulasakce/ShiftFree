import { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType, Role, User, AutoApprovalRule } from "./types";

// Only the Super Admin exists initially.
// All other data is empty to ensure a clean slate.

export const SEED_USERS: User[] = [
  {
    id: 'admin_001',
    companyId: 'company_default',
    name: 'Admin',
    email: 'admin@shiftfree.com',
    role: Role.MANAGER,
    department: 'Yönetim',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  }
];

export const SEED_BALANCES: Record<string, LeaveBalance[]> = {
  // Admin doesn't necessarily need balances, but good to have to prevent errors if they check profile
  'admin_001': [
    { type: LeaveType.ANNUAL, total: 30, used: 0, remaining: 30 },
    { type: LeaveType.CASUAL, total: 10, used: 0, remaining: 10 },
    { type: LeaveType.SICK, total: 30, used: 0, remaining: 30 },
  ]
};

export const SEED_REQUESTS: LeaveRequest[] = [];

// Keep default rules so the system works out of the box, but user can delete them.
export const SEED_RULES: AutoApprovalRule[] = [
  { id: 'rule1', companyId: 'company_default', type: LeaveType.ANNUAL, enabled: false, minDaysNotice: 14, maxDuration: 5, requireSufficientBalance: true },
  { id: 'rule2', companyId: 'company_default', type: LeaveType.CASUAL, enabled: true, minDaysNotice: 1, maxDuration: 2, requireSufficientBalance: true },
];