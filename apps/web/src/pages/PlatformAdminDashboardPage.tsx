import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { UserRole } from '@antigravite/types';
import {
  ShieldAlert,
  Building,
  Users,
  Briefcase,
  Megaphone,
  FileText,
  Activity,
  CheckCircle,
  Plus,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  UserCheck,
  Shield,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const PlatformAdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'companies' | 'candidates' | 'companyUsers' | 'admins' | 'jobs' | 'ads' | 'audit' | 'settings'
  >('overview');

  const [loading, setLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modals
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');

  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'MANAGE_COMPANIES',
    'MANAGE_CANDIDATES',
    'MANAGE_JOBS',
    'VIEW_REPORTS',
  ]);

  const isSuperAdmin = user?.role === UserRole.PLATFORM_ADMIN;

  // Load Overview stats
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/overview');
      setStats(res.data.data);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/companies');
      setCompanies(res.data.data.companies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/candidates');
      setCandidates(res.data.data.candidates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/company-users');
      setCompanyUsers(res.data.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/admins');
      setAdmins(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/jobs');
      setJobs(res.data.data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/campaigns');
      setCampaigns(res.data.data.campaigns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/audit-logs');
      setAuditLogs(res.data.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'overview') fetchOverview();
    if (tab === 'companies') fetchCompanies();
    if (tab === 'candidates') fetchCandidates();
    if (tab === 'companyUsers') fetchCompanyUsers();
    if (tab === 'admins' && isSuperAdmin) fetchAdmins();
    if (tab === 'jobs') fetchJobs();
    if (tab === 'ads') fetchCampaigns();
    if (tab === 'audit') fetchAuditLogs();
  };

  // Actions
  const handleToggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/companies/${companyId}/status`, { status: nextStatus });
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update company status');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (activeTab === 'candidates') fetchCandidates();
      if (activeTab === 'companyUsers') fetchCompanyUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName) return;
    try {
      await apiClient.post('/admin/companies', {
        name: newCompanyName,
        industry: newCompanyIndustry,
        location: newCompanyLocation,
      });
      setShowCreateCompanyModal(false);
      setNewCompanyName('');
      setNewCompanyIndustry('');
      setNewCompanyLocation('');
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create company');
    }
  };

  const handleCreateAdminManager = async () => {
    if (!newAdminEmail || !newAdminPassword) return;
    try {
      await apiClient.post('/admin/admins', {
        email: newAdminEmail,
        password: newAdminPassword,
        permissions: selectedPermissions,
      });
      setShowCreateAdminModal(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create admin manager');
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    try {
      await apiClient.patch(`/admin/jobs/${jobId}/status`, { status: nextStatus });
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update job status');
    }
  };

  const availablePermissions = [
    { key: 'MANAGE_COMPANIES', label: 'Manage Companies & Organizations' },
    { key: 'MANAGE_CANDIDATES', label: 'Manage Candidate Accounts' },
    { key: 'MANAGE_JOBS', label: 'Moderate Platform Job Postings' },
    { key: 'VIEW_REPORTS', label: 'Access Audit Logs & Analytics' },
    { key: 'MANAGE_RECRUITMENT', label: 'Manage Platform Recruitment Pipelines' },
    { key: 'MANAGE_ADS', label: 'Manage Platform Advertising Campaigns' },
    { key: 'MANAGE_SETTINGS', label: 'Configure Operational Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#269194] to-[#60d1d4] flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#60d1d4]/10">
            <ShieldAlert className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">
                JobMatch Platform Command Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#60d1d4]/20 text-[#60d1d4] border border-[#60d1d4]/30 uppercase">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleTabChange(activeTab)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh current view"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold border border-red-800/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar Navigation */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/70 border-r border-slate-800/80 p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Platform Modules
          </div>

          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'companies', label: 'Companies', icon: Building },
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'companyUsers', label: 'Company Users', icon: UserCheck },
            ...(isSuperAdmin
              ? [{ id: 'admins', label: 'Admins & Managers', icon: Shield }]
              : []),
            { id: 'jobs', label: 'Jobs & Postings', icon: Briefcase },
            { id: 'ads', label: 'Advertising Campaigns', icon: Megaphone },
            { id: 'audit', label: 'Security Audit Logs', icon: FileText },
            { id: 'settings', label: 'Platform Configuration', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#269194] to-[#3eb8bb] text-slate-950 font-bold shadow-md shadow-[#269194]/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-950 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Platform Performance & Statistics</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Live operational snapshot across all registered organizations, candidates, and services
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Candidates</span>
                    <Users className="w-4 h-4 text-[#60d1d4]" />
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    {stats?.totalCandidates ?? '...'}
                  </div>
                  <div className="text-[11px] text-green-400 mt-1 font-medium">Job seeker accounts</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Active Companies</span>
                    <Building className="w-4 h-4 text-[#60d1d4]" />
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    {stats?.totalCompanies ?? '...'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Multi-tenant organizations</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Published Jobs</span>
                    <Briefcase className="w-4 h-4 text-[#60d1d4]" />
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    {stats?.activeJobs ?? '...'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {stats?.totalJobs ?? 0} total listings created
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Ad Budget</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    ${stats?.totalAdSpend ? stats.totalAdSpend.toLocaleString() : '0'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">Across promoted campaigns</div>
                </div>
              </div>

              {/* Sub-breakdown & System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 lg:col-span-2">
                  <h3 className="text-sm font-bold text-white mb-4">Company Team Member Distribution</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-xl font-extrabold text-[#60d1d4]">{stats?.totalRecruiters ?? 0}</div>
                      <div className="text-xs text-slate-400 mt-1">Recruiters</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-xl font-extrabold text-[#60d1d4]">{stats?.totalHiringManagers ?? 0}</div>
                      <div className="text-xs text-slate-400 mt-1">Hiring Managers</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      <div className="text-xl font-extrabold text-[#60d1d4]">{stats?.totalAdsManagers ?? 0}</div>
                      <div className="text-xs text-slate-400 mt-1">Ads Managers</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-4">System Security & Health</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">PostgreSQL DB</span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">RBAC Enforcement</span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Strict Multi-Tenant
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Audit Logging</span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400">Rate Limiter</span>
                      <span className="text-green-400 font-semibold flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Armed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANIES */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Company Organizations</h2>
                  <p className="text-xs text-slate-400">Manage tenant companies, status, and members</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateCompanyModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Organization
                </Button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Company</th>
                      <th className="px-5 py-3.5">Industry & Location</th>
                      <th className="px-5 py-3.5">Employees</th>
                      <th className="px-5 py-3.5">Active Jobs</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {companies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{c.name}</td>
                        <td className="px-5 py-4 text-slate-400">
                          {c.industry || 'Tech'} • {c.location || 'Remote'}
                        </td>
                        <td className="px-5 py-4">{c.employeeCount}</td>
                        <td className="px-5 py-4">{c.activeJobsCount}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleCompanyStatus(c.id, c.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              c.status === 'ACTIVE'
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                          No company organizations registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATES */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Candidate Accounts</h2>
                <p className="text-xs text-slate-400">View and manage job seeker profiles and access status</p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Location</th>
                      <th className="px-5 py-3.5">Applications</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {candidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{cand.fullName}</td>
                        <td className="px-5 py-4 text-slate-400">{cand.email}</td>
                        <td className="px-5 py-4">{cand.location || 'Remote'}</td>
                        <td className="px-5 py-4">{cand.applicationsCount}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cand.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {cand.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(cand.id, cand.status)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
                          >
                            {cand.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {candidates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                          No candidate accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMPANY USERS */}
          {activeTab === 'companyUsers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Company Users & Internal Roles</h2>
                <p className="text-xs text-slate-400">Recruiters, Hiring Managers, and Ads Managers assigned to organizations</p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">User Email</th>
                      <th className="px-5 py-3.5">Assigned Organization</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {companyUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{u.email}</td>
                        <td className="px-5 py-4 text-slate-400">{u.organizationName || 'No Organization'}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[#60d1d4] font-mono text-[10px] font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {companyUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No company staff accounts registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ADMINS & MANAGERS (Super Admin Only) */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Administrators & Admin Managers</h2>
                  <p className="text-xs text-slate-400">
                    Control primary administrators and provision secondary Admin Managers with scoped permissions
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateAdminModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Provision Admin Manager
                </Button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Administrator Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Explicit Permissions</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">MFA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {admins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{adm.email}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              adm.role === 'PLATFORM_ADMIN'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-[#60d1d4]/20 text-[#60d1d4] border border-[#60d1d4]/30'
                            }`}
                          >
                            {adm.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          {adm.role === 'PLATFORM_ADMIN' ? (
                            <span className="text-amber-400 text-xs font-semibold">Unrestricted Super-Admin</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {adm.adminPermissions?.map((p: string) => (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-green-400 font-bold">{adm.status}</td>
                        <td className="px-5 py-4 text-slate-400">
                          {adm.mfaEnabled ? 'Enabled' : 'Disabled'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Platform-Wide Job Moderation</h2>
                <p className="text-xs text-slate-400">Review, publish, and moderate jobs across all employers</p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Title</th>
                      <th className="px-5 py-3.5">Organization</th>
                      <th className="px-5 py-3.5">Location & Type</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{j.title}</td>
                        <td className="px-5 py-4 text-slate-400">{j.organizationName}</td>
                        <td className="px-5 py-4">
                          {j.location || 'Remote'} • {j.jobType}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              j.status === 'PUBLISHED' ? 'text-green-400' : 'text-slate-400'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleJobStatus(j.id, j.status)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
                          >
                            {j.status === 'PUBLISHED' ? 'Close Posting' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No platform jobs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ADVERTISING */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Advertising Campaigns</h2>
                <p className="text-xs text-slate-400">Oversight of all sponsored and promoted job campaigns</p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Campaign</th>
                      <th className="px-5 py-3.5">Organization</th>
                      <th className="px-5 py-3.5">Budget</th>
                      <th className="px-5 py-3.5">Spent</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-semibold text-white">{camp.name}</td>
                        <td className="px-5 py-4 text-slate-400">{camp.organizationName}</td>
                        <td className="px-5 py-4">${camp.budget}</td>
                        <td className="px-5 py-4">${camp.spent}</td>
                        <td className="px-5 py-4 font-bold text-[#60d1d4]">{camp.status}</td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No active campaigns found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Security & Audit Trail</h2>
                <p className="text-xs text-slate-400">
                  Immutable record of authentication, privilege changes, administrative updates, and security events
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Actor & Role</th>
                      <th className="px-5 py-3.5">Resource</th>
                      <th className="px-5 py-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="px-5 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-3 font-bold text-[#60d1d4]">{log.action}</td>
                        <td className="px-5 py-3 text-slate-300">
                          {log.userEmail || 'Anonymous'} ({log.userRole || 'GUEST'})
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {log.resource} {log.resourceId ? `#${log.resourceId.slice(0, 8)}` : ''}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Security Configuration</h2>
                <p className="text-xs text-slate-400">Security policies, session lifetimes, and brute-force protection</p>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Security Protections</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <div className="font-semibold text-white">Admin Brute-Force Rate Limiting</div>
                      <div className="text-slate-400">Max 10 login attempts per 15 minutes per IP</div>
                    </div>
                    <span className="text-green-400 font-bold">Enforced</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <div className="font-semibold text-white">JWT Access Token Expiry</div>
                      <div className="text-slate-400">15 minutes lifetime with rotating SHA-256 refresh cookie</div>
                    </div>
                    <span className="text-green-400 font-bold">Enforced</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <div className="font-semibold text-white">Multi-Tenant Tenant Isolation</div>
                      <div className="text-slate-400">Backend database filter on every company query & mutation</div>
                    </div>
                    <span className="text-green-400 font-bold">Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Create Organization */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Organization</h3>
            <div className="space-y-3">
              <Input
                label="Organization Name"
                placeholder="e.g. Stripe Technologies"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <Input
                label="Industry"
                placeholder="e.g. Fintech / Software"
                value={newCompanyIndustry}
                onChange={(e) => setNewCompanyIndustry(e.target.value)}
              />
              <Input
                label="Headquarters Location"
                placeholder="e.g. San Francisco, CA"
                value={newCompanyLocation}
                onChange={(e) => setNewCompanyLocation(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreateCompanyModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateCompany}>
                Create Organization
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Provision Admin Manager */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Provision Admin Manager</h3>
            <p className="text-xs text-slate-400 mb-4">
              Assign explicit administrative permissions to a secondary platform manager
            </p>
            <div className="space-y-3">
              <Input
                label="Manager Email"
                type="email"
                placeholder="manager@jobmatch.internal"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <Input
                label="Temporary Password"
                type="password"
                placeholder="Min 8 characters (letters & numbers)"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
              />

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Assign Granular Permissions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availablePermissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm.key]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.key));
                            }
                          }}
                          className="rounded border-slate-700 text-[#60d1d4] focus:ring-0"
                        />
                        <span className="text-slate-200">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreateAdminModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateAdminManager}>
                Provision Admin Manager
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
