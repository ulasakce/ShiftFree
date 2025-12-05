export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
}

export enum LeaveType {
  ANNUAL = 'Yıllık İzin',
  SICK = 'Hastalık İzni',
  CASUAL = 'Mazeret İzni',
  UNPAID = 'Ücretsiz İzin',
}

export enum LeaveStatus {
  PENDING = 'Beklemede',
  APPROVED = 'Onaylandı',
  REJECTED = 'Reddedildi',
}

export interface Company {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  roles: string[];
}

export interface CompanyPolicy {
  id?: string;
  companyId?: string;
  annual: number;
  sick: number;
  casual: number;
}

export interface User {
  id: string;
  companyId: string; // Link to Company
  name: string;
  email: string;
  role: Role;
  jobTitle?: string;
  department: string;
  managerName?: string;
  avatarUrl?: string;
  companyName?: string; // Display name
}

export interface LeaveRequest {
  id: string;
  companyId: string; // Link to Company
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
}

export interface LeaveBalance {
  id?: string;
  companyId?: string; // Link to Company
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
}

export interface AutoApprovalRule {
  id: string;
  companyId: string; // Link to Company
  type: LeaveType;
  enabled: boolean;
  minDaysNotice: number;
  maxDuration: number;
  requireSufficientBalance: boolean;
}