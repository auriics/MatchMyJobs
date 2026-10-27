import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { UserRole } from '@antigravite/types';
import {
  Briefcase,
  Users,
  Megaphone,
  UserCheck,
  Plus,
  Calendar,
  ChevronRight,
  Building,
  Star,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Upload,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { RichTextEditor } from '../components/common/RichTextEditor';

export const CompanyDashboardPage: React.FC = () => {
  const { user, companyProfile, setCompanyProfile } = useAuthStore();
  const role = user?.role;

  // Tabs based on role
  const isOwner = role === UserRole.COMPANY_OWNER || role === UserRole.PLATFORM_ADMIN;
  const isRecruiter = role === UserRole.RECRUITER || isOwner;
  const isHiringManager = role === UserRole.HIRING_MANAGER || isOwner;
  const isAdsManager = role === UserRole.ADS_MANAGER || isOwner;

  const defaultTab = isRecruiter ? 'jobs' : isHiringManager ? 'hiring' : isAdsManager ? 'ads' : 'jobs';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // States
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [recruiterStats, setRecruiterStats] = useState<any>(null);
  const [hiringStats, setHiringStats] = useState<any>(null);
  const [adsAnalytics, setAdsAnalytics] = useState<any>(null);

  // Top Candidates AI Matching State
  const [selectedJobForMatches, setSelectedJobForMatches] = useState<string>('');
  const [topCandidateMatches, setTopCandidateMatches] = useState<any[]>([]);
  const [loadingTopMatches, setLoadingTopMatches] = useState(false);

  // Company Profile & Logo State
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editCompanyName, setEditCompanyName] = useState(companyProfile?.name || user?.organizationName || '');
  const [editCompanyWebsite, setEditCompanyWebsite] = useState(companyProfile?.website || '');
  const [editCompanyIndustry, setEditCompanyIndustry] = useState(companyProfile?.industry || 'Technology');
  const [editCompanySize, setEditCompanySize] = useState(companyProfile?.size || '11-50');
  const [editCompanyDescription, setEditCompanyDescription] = useState(companyProfile?.description || '');
  const [editCompanyLocation, setEditCompanyLocation] = useState(companyProfile?.location || 'San Francisco, CA');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(companyProfile?.logoUrl || null);
  const [savingCompanyProfile, setSavingCompanyProfile] = useState(false);

  // Modals
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('<p>We are seeking an experienced professional to join our dynamic team...</p>');
  const [jobDepartment, setJobDepartment] = useState('Engineering');
  const [jobLocation, setJobLocation] = useState('Remote');
  const [jobWorkplaceType, setJobWorkplaceType] = useState('REMOTE');
  const [jobStatus, setJobStatus] = useState('ACTIVE');
  const [jobSalaryMin, setJobSalaryMin] = useState('90000');
  const [jobSalaryMax, setJobSalaryMax] = useState('140000');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [jobSkills, setJobSkills] = useState('React, TypeScript, Node.js');
  const [creatingJob, setCreatingJob] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState('');

  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedAppForEval, setSelectedAppForEval] = useState<any>(null);
  const [evalRating, setEvalRating] = useState(5);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalRecommendation, setEvalRecommendation] = useState('HIRE');

  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campBudget, setCampBudget] = useState('500');
  const [campDailyBudget, setCampDailyBudget] = useState('50');
  const [campJobId, setCampJobId] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.RECRUITER);

  const fetchRecruiterData = async () => {
    try {
      const [jobsRes, appsRes, statsRes] = await Promise.all([
        apiClient.get('/company/jobs'),
        apiClient.get('/company/applications'),
        apiClient.get('/company/recruiter/stats'),
      ]);
      setJobs(jobsRes.data.data);
      setApplications(appsRes.data.data);
      setRecruiterStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHiringData = async () => {
    try {
      const [candidatesRes, statsRes] = await Promise.all([
        apiClient.get('/company/hiring/shortlisted'),
        apiClient.get('/company/hiring/stats'),
      ]);
      setApplications(candidatesRes.data.data);
      setHiringStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdsData = async () => {
    try {
      const [campsRes, analyticsRes] = await Promise.all([
        apiClient.get('/company/ads/campaigns'),
        apiClient.get('/company/ads/analytics'),
      ]);
      setCampaigns(campsRes.data.data);
      setAdsAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamData = async () => {
    try {
      const res = await apiClient.get('/company/team');
      setTeamMembers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTopCandidateMatches = async (jobId: string) => {
    if (!jobId) return;
    setSelectedJobForMatches(jobId);
    setLoadingTopMatches(true);
    try {
      const res = await apiClient.get(`/match/candidates/${jobId}`);
      if (res.data.data && res.data.data.length > 0) {
        setTopCandidateMatches(res.data.data);
      } else {
        const postRes = await apiClient.post('/match/candidates', { jobId });
        setTopCandidateMatches(postRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch candidate matches:', err);
    } finally {
      setLoadingTopMatches(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs' || activeTab === 'applications') fetchRecruiterData();
    if (activeTab === 'candidates' && jobs.length > 0) {
      fetchTopCandidateMatches(selectedJobForMatches || jobs[0].id);
    }
    if (activeTab === 'hiring') fetchHiringData();
    if (activeTab === 'ads') fetchAdsData();
    if (activeTab === 'team') fetchTeamData();
  }, [activeTab]);

  // Actions
  const handleCreateJob = async () => {
    setCreatingJob(true);
    try {
      await apiClient.post('/jobs', {
        title: jobTitle,
        description: jobDescription,
        department: jobDepartment,
        location: jobLocation,
        workplaceType: jobWorkplaceType,
        status: jobStatus,
        salaryMin: Number(jobSalaryMin),
        salaryMax: Number(jobSalaryMax),
        jobType,
        requirements: jobSkills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setShowCreateJobModal(false);
      setJobTitle('');
      setJobDescription('<p>We are seeking an experienced professional to join our dynamic team...</p>');
      fetchRecruiterData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create job');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleArchiveJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to archive this job listing? It will no longer be visible to candidates.')) return;
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      fetchRecruiterData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to archive job');
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCompanyProfile = async () => {
    setSavingCompanyProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', editCompanyName);
      formData.append('website', editCompanyWebsite);
      formData.append('industry', editCompanyIndustry);
      formData.append('size', editCompanySize);
      formData.append('description', editCompanyDescription);
      formData.append('location', editCompanyLocation);
      if (companyLogoFile) {
        formData.append('logo', companyLogoFile);
      }

      const res = await apiClient.put('/company/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompanyProfile(res.data.data);
      alert('Company profile & branding updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update company profile');
    } finally {
      setSavingCompanyProfile(false);
    }
  };

  const handleUpdateStage = async (appId: string, nextStage: string) => {
    try {
      await apiClient.patch(`/company/applications/${appId}/stage`, { status: nextStage });
      fetchRecruiterData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update stage');
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedAppForInterview || !interviewDate) return;
    try {
      await apiClient.post('/company/interviews', {
        applicationId: selectedAppForInterview.id,
        interviewerId: user?.id,
        scheduledAt: new Date(interviewDate).toISOString(),
        durationMinutes: 45,
      });
      setShowScheduleModal(false);
      fetchRecruiterData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to schedule interview');
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedAppForEval) return;
    try {
      await apiClient.post('/company/hiring/evaluation', {
        applicationId: selectedAppForEval.id,
        feedback: evalFeedback,
        rating: evalRating,
        recommendation: evalRecommendation,
      });
      setShowEvalModal(false);
      fetchHiringData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record evaluation');
    }
  };

  const handleHiringDecision = async (appId: string, decision: 'OFFERED' | 'REJECTED') => {
    try {
      await apiClient.post('/company/hiring/decision', {
        applicationId: appId,
        decision,
      });
      fetchHiringData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to execute hiring decision');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await apiClient.post('/company/ads/campaigns', {
        name: campName,
        budget: Number(campBudget),
        dailyBudget: Number(campDailyBudget),
        jobId: campJobId || undefined,
      });
      setShowCreateCampaignModal(false);
      fetchAdsData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create campaign');
    }
  };

  const handleInviteMember = async () => {
    try {
      await apiClient.post('/company/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      alert(`Invitation generated for ${inviteEmail}.`);
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) return;
    try {
      await apiClient.delete(`/company/team/${memberId}`);
      fetchTeamData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16 font-sans">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-[#062224] via-[#14595c] to-[#269194] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-[#60d1d4] text-[#062224] flex items-center justify-center font-black text-2xl shadow-lg shadow-black/20">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">
                  {user?.organizationName || companyProfile?.name || 'Company Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#60d1d4] text-[#062224] uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-[#b1f0ee] mt-0.5">
                Multi-Tenant Company Recruitment & Talent Management Workspace
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-3">
            {isRecruiter && (
              <Button
                variant="secondary"
                onClick={() => setShowCreateJobModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Post New Job
              </Button>
            )}
            {isOwner && (
              <Button
                variant="primary"
                onClick={() => setShowInviteModal(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Invite Team Member
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex flex-wrap gap-1 mb-8">
          {isRecruiter && (
            <>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'jobs' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Job Listings ({jobs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'candidates' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#60d1d4]" />
                <span>Top Candidates (AI)</span>
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'applications' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Recruiter Pipeline ({applications.length})</span>
              </button>
            </>
          )}

          {isHiringManager && (
            <button
              onClick={() => setActiveTab('hiring')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'hiring' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Hiring Manager Reviews</span>
            </button>
          )}

          {isAdsManager && (
            <button
              onClick={() => setActiveTab('ads')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                activeTab === 'ads' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Advertising Campaigns ({campaigns.length})</span>
            </button>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'profile' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Company Profile & Branding</span>
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'team' ? 'bg-[#062224] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Team & Members ({teamMembers.length})</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: RECRUITER JOBS */}
        {activeTab === 'jobs' && isRecruiter && (
          <div className="space-y-6">
            {/* Recruiter Metrics */}
            {recruiterStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Active Listings</span>
                  <div className="text-2xl font-extrabold text-[#062224] mt-1">{recruiterStats.activeJobsCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Total Applications</span>
                  <div className="text-2xl font-extrabold text-[#062224] mt-1">{recruiterStats.totalApplicationsCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Shortlisted</span>
                  <div className="text-2xl font-extrabold text-[#269194] mt-1">{recruiterStats.shortlistedCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Interviews Scheduled</span>
                  <div className="text-2xl font-extrabold text-purple-600 mt-1">{recruiterStats.interviewsScheduledCount}</div>
                </div>
              </div>
            )}

            {/* Jobs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const isArchived = job.status === 'ARCHIVED';
                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-2xl p-6 border shadow-sm transition-all flex flex-col justify-between ${
                      isArchived
                        ? 'border-gray-200 opacity-70 bg-gray-50/50'
                        : 'border-gray-100 hover:border-[#60d1d4]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e2f7f9] text-[#269194]">
                          {job.department || 'General'}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            job.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'ARCHIVED'
                              ? 'bg-gray-100 text-gray-500 border border-gray-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-[#062224]">{job.title}</h3>
                        <div className="flex items-center space-x-1 shrink-0">
                          <Link
                            to={`/jobs/${job.id}`}
                            target="_blank"
                            title="View Public Listing"
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#269194]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {!isArchived && (
                            <button
                              onClick={() => handleArchiveJob(job.id)}
                              title="Archive Listing"
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {job.location || 'Remote'} ({job.workplaceType || 'REMOTE'}) • $
                        {job.salaryMin ? `${Math.round(job.salaryMin / 1000)}k` : '80k'} - $
                        {job.salaryMax ? `${Math.round(job.salaryMax / 1000)}k` : '120k'}
                      </p>

                      <div
                        className="text-xs text-gray-600 mt-3 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                      />

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {job.requirements?.slice(0, 3).map((req: string) => (
                          <span
                            key={req}
                            className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-700"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                      <button
                        onClick={() => {
                          setSelectedJobForMatches(job.id);
                          fetchTopCandidateMatches(job.id);
                          setActiveTab('candidates');
                        }}
                        className="text-[#269194] hover:underline flex items-center font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Top Candidates
                      </button>

                      <button
                        onClick={() => setActiveTab('applications')}
                        className="text-gray-500 hover:text-[#062224] flex items-center"
                      >
                        {job.applicationsCount || 0} Applicants <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {jobs.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No jobs posted yet.</p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowCreateJobModal(true)}>
                    Create First Job
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1.5: MODULE 3 - TOP CANDIDATES (RECRUITER VIEW) */}
        {activeTab === 'candidates' && isRecruiter && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e2f7f9] text-[#269194] uppercase tracking-wide">
                    AI Talent Matching
                  </span>
                  <h2 className="text-lg font-bold text-[#062224]">Top Matched Candidates</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  AI-ranked candidates based on cosine similarity between job requirements and verified candidate profiles.
                </p>
              </div>

              {/* Job Selector & Re-score */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={selectedJobForMatches}
                  onChange={(e) => fetchTopCandidateMatches(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-[#062224] bg-white focus:outline-none focus:border-[#60d1d4]"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.status})
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fetchTopCandidateMatches(selectedJobForMatches)}
                  isLoading={loadingTopMatches}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Score Candidates
                </Button>
              </div>
            </div>

            {/* Candidates Results Grid */}
            {loadingTopMatches ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-16 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : topCandidateMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {topCandidateMatches.map((match) => {
                  const scorePct = Math.round(match.score * 100);
                  const isHigh = scorePct >= 80;
                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#60d1d4] shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Score & Candidate Header */}
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs flex items-center ${
                              isHigh ? 'bg-emerald-500 text-white' : 'bg-[#269194] text-white'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            {scorePct}% Match
                          </span>
                          <span className="text-[11px] font-semibold text-gray-500">
                            {match.candidate?.location || 'Remote'}
                          </span>
                        </div>

                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-[#e2f7f9] text-[#269194] font-black text-lg flex items-center justify-center shrink-0">
                            {match.candidate?.fullName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-[#062224]">
                              {match.candidate?.fullName || 'Candidate'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {match.candidate?.headline || 'Qualified Candidate'}
                            </p>
                          </div>
                        </div>

                        {/* AI Reason Chip */}
                        {match.reason && (
                          <div className="px-3 py-2 rounded-xl bg-[#f0fafb] border border-[#b1f0ee] text-xs text-[#14595c] font-medium flex items-center mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-[#269194] mr-1.5 shrink-0" />
                            <span>{match.reason}</span>
                          </div>
                        )}

                        {/* Matched Skills */}
                        {match.matchedSkills?.length > 0 && (
                          <div className="mb-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Matched Skills
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {match.matchedSkills.map((sk: string) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                                >
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {match.candidate?.jobTypePreference || 'Full Time'}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAppForInterview({
                              id: match.candidateId,
                              candidateName: match.candidate?.fullName || 'Candidate',
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          Interview
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-8">
                <Sparkles className="w-10 h-10 text-[#269194] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#062224]">No Candidates Matched Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                  Select an active job listing and click "Score Candidates" to calculate semantic similarity scores.
                </p>
                {jobs.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fetchTopCandidateMatches(jobs[0].id)}
                  >
                    Score Candidates for {jobs[0].title}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1.7: COMPANY PROFILE & LOGO BRANDING */}
        {activeTab === 'profile' && isOwner && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#062224]">Company Profile & Logo</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your organization details and public employer branding
              </p>
            </div>

            {/* Logo Upload */}
            <div className="flex items-center space-x-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {companyLogoPreview ? (
                  <img
                    src={companyLogoPreview}
                    alt="Company Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#062224] uppercase">Company Logo</h4>
                <p className="text-xs text-gray-500">
                  Upload square PNG, JPG, or WEBP (Max 5MB). Displayed on all job listings.
                </p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => logoInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload New Logo
                </Button>
              </div>
            </div>

            {/* Company Fields */}
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Website"
                  value={editCompanyWebsite}
                  placeholder="https://example.com"
                  onChange={(e) => setEditCompanyWebsite(e.target.value)}
                />
                <Input
                  label="Headquarters / Location"
                  value={editCompanyLocation}
                  onChange={(e) => setEditCompanyLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                    Industry
                  </label>
                  <select
                    value={editCompanyIndustry}
                    onChange={(e) => setEditCompanyIndustry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-medium focus:outline-none focus:border-[#60d1d4]"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Healthcare">Healthcare & Bio</option>
                    <option value="E-commerce">E-commerce & Retail</option>
                    <option value="Media">Media & Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                    Company Size
                  </label>
                  <select
                    value={editCompanySize}
                    onChange={(e) => setEditCompanySize(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-medium focus:outline-none focus:border-[#60d1d4]"
                  >
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="201-500">201-500 Employees</option>
                    <option value="500+">500+ Employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                  About Organization / Employer Value Proposition
                </label>
                <textarea
                  rows={4}
                  value={editCompanyDescription}
                  onChange={(e) => setEditCompanyDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-[#60d1d4]"
                  placeholder="Introduce your company culture, mission, and benefits..."
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveCompanyProfile}
                  isLoading={savingCompanyProfile}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save Profile & Branding
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECRUITER PIPELINE */}
        {activeTab === 'applications' && isRecruiter && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#062224]">Candidate Recruitment Pipeline</h2>
              <span className="text-xs text-gray-500">{applications.length} Candidates</span>
            </div>

            <div className="divide-y divide-gray-100">
              {applications.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-[#e2f7f9] text-[#269194] font-bold text-lg flex items-center justify-center shrink-0">
                      {app.candidateName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-[#062224]">{app.candidateName}</h3>
                        <span className="text-xs text-gray-400">applied for</span>
                        <span className="text-xs font-semibold text-[#269194]">{app.jobTitle}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{app.candidateHeadline || 'Candidate'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {app.candidateSkills?.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stage and Actions */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee]">
                      {app.status}
                    </span>

                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStage(app.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white font-medium text-[#062224] focus:outline-none"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="SCREENING">Screening</option>
                      <option value="SHORTLISTED">Shortlist</option>
                      <option value="INTERVIEW_SCHEDULED">Schedule Interview</option>
                      <option value="OFFERED">Extend Offer</option>
                      <option value="REJECTED">Reject</option>
                      <option value="HIRED">Hire</option>
                    </select>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedAppForInterview(app);
                        setShowScheduleModal(true);
                      }}
                      leftIcon={<Calendar className="w-3.5 h-3.5" />}
                    >
                      Interview
                    </Button>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="p-12 text-center text-sm text-gray-500">
                  No candidate applications received yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HIRING MANAGER */}
        {activeTab === 'hiring' && isHiringManager && (
          <div className="space-y-6">
            {hiringStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Shortlisted For You</span>
                  <div className="text-2xl font-extrabold text-[#062224] mt-1">{hiringStats.shortlistedCandidatesCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Pending Feedback</span>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">{hiringStats.pendingFeedbackCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Approved Candidates</span>
                  <div className="text-2xl font-extrabold text-green-600 mt-1">{hiringStats.approvedCandidatesCount}</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-[#062224]">Shortlisted Candidates for Review & Decision</h2>
                <p className="text-xs text-gray-500">Provide interview evaluations and record hiring recommendations</p>
              </div>

              <div className="divide-y divide-gray-100">
                {applications.map((cand) => (
                  <div key={cand.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-[#062224]">{cand.candidateName}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {cand.jobTitle}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cand.candidateHeadline || 'Candidate'}</p>
                      {cand.feedback && (
                        <div className="mt-2 p-2.5 rounded-xl bg-gray-50 text-xs text-gray-700 border border-gray-100">
                          <span className="font-bold">Evaluation: </span> {cand.feedback} ({cand.rating}/5 Stars)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedAppForEval(cand);
                          setShowEvalModal(true);
                        }}
                        leftIcon={<Star className="w-3.5 h-3.5" />}
                      >
                        Evaluate
                      </Button>

                      <button
                        onClick={() => handleHiringDecision(cand.id, 'OFFERED')}
                        className="p-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold flex items-center space-x-1"
                        title="Extend Job Offer"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Offer</span>
                      </button>

                      <button
                        onClick={() => handleHiringDecision(cand.id, 'REJECTED')}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center space-x-1"
                        title="Decline Candidate"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="p-12 text-center text-sm text-gray-500">
                    No shortlisted candidates assigned for review.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADS MANAGER */}
        {activeTab === 'ads' && isAdsManager && (
          <div className="space-y-6">
            {adsAnalytics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Total Ad Spend</span>
                  <div className="text-2xl font-extrabold text-[#062224] mt-1">${adsAnalytics.totalSpent}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Impressions</span>
                  <div className="text-2xl font-extrabold text-[#269194] mt-1">{adsAnalytics.totalImpressions.toLocaleString()}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Clicks</span>
                  <div className="text-2xl font-extrabold text-blue-600 mt-1">{adsAnalytics.totalClicks.toLocaleString()}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Avg CTR</span>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">{adsAnalytics.avgCtr}%</div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-[#062224]">Recruitment Campaigns</h2>
                <p className="text-xs text-gray-500">Promote open positions to maximize candidate discovery</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowCreateCampaignModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Launch Campaign
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-5 py-3">Promoted Position</th>
                    <th className="px-5 py-3">Budget</th>
                    <th className="px-5 py-3">Spent</th>
                    <th className="px-5 py-3">Impressions</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-4 font-bold text-[#062224]">{c.name}</td>
                      <td className="px-5 py-4 text-gray-500">{c.jobTitle || 'General Recruitment'}</td>
                      <td className="px-5 py-4 font-medium">${c.budget}</td>
                      <td className="px-5 py-4 font-medium text-emerald-600">${c.spent}</td>
                      <td className="px-5 py-4">{c.impressions}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                        No advertising campaigns running.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TEAM & PERMISSIONS */}
        {activeTab === 'team' && isOwner && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-[#062224]">Company Team Members</h2>
                <p className="text-xs text-gray-500">Authorized recruiters, hiring managers, and ads managers</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowInviteModal(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Invite Member
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Member Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-4 font-bold text-[#062224]">{m.email}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-[#269194]">{m.role}</td>
                      <td className="px-5 py-4 text-green-600 font-medium">{m.status}</td>
                      <td className="px-5 py-4 text-right">
                        {m.role !== 'COMPANY_OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Create Job with Tiptap Rich Text Editor */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#062224] mb-1">Post New Job Listing</h3>
            <p className="text-xs text-gray-500 mb-5">
              Publish an AI-discoverable vacancy or save as a draft.
            </p>

            <div className="space-y-4">
              <Input
                label="Job Title"
                placeholder="e.g. Senior Full-Stack Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />

              {/* Rich Text Editor for Description (@tiptap/react) */}
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                  Job Description (Rich Text Editor)
                </label>
                <RichTextEditor
                  content={jobDescription}
                  onChange={(html) => setJobDescription(html)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Department"
                  value={jobDepartment}
                  onChange={(e) => setJobDepartment(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                    Workplace Type
                  </label>
                  <select
                    value={jobWorkplaceType}
                    onChange={(e) => setJobWorkplaceType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-medium focus:outline-none focus:border-[#60d1d4]"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>

                <Input
                  label="Location"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                    Employment Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-medium focus:outline-none focus:border-[#60d1d4]"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white font-medium focus:outline-none focus:border-[#60d1d4]"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="DRAFT">Draft (Unpublished)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Required Skills (comma-separated)"
                placeholder="React, TypeScript, Node.js, PostgreSQL"
                value={jobSkills}
                onChange={(e) => setJobSkills(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Salary Min ($/year)"
                  type="number"
                  value={jobSalaryMin}
                  onChange={(e) => setJobSalaryMin(e.target.value)}
                />
                <Input
                  label="Salary Max ($/year)"
                  type="number"
                  value={jobSalaryMax}
                  onChange={(e) => setJobSalaryMax(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowCreateJobModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateJob}
                isLoading={creatingJob}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {jobStatus === 'ACTIVE' ? 'Publish Job' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Interview */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#062224] mb-2">Schedule Interview</h3>
            <p className="text-xs text-gray-500 mb-4">Candidate: {selectedAppForInterview?.candidateName}</p>
            <Input label="Date & Time" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleScheduleInterview}>Schedule Interview</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Submit Evaluation */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#062224] mb-2">Candidate Interview Evaluation</h3>
            <p className="text-xs text-gray-500 mb-4">Evaluating {selectedAppForEval?.candidateName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Rating (1 to 5 Stars)</label>
                <select value={evalRating} onChange={(e) => setEvalRating(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 p-2 text-xs">
                  <option value={5}>5 - Exceptional</option>
                  <option value={4}>4 - Strong Hire</option>
                  <option value={3}>3 - Acceptable</option>
                  <option value={2}>2 - Marginal</option>
                  <option value={1}>1 - Not a Match</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Recommendation</label>
                <select value={evalRecommendation} onChange={(e) => setEvalRecommendation(e.target.value)} className="w-full rounded-xl border border-gray-200 p-2 text-xs">
                  <option value="STRONG_HIRE">Strong Hire</option>
                  <option value="HIRE">Hire</option>
                  <option value="HOLD">Hold / Second Opinion</option>
                  <option value="NO_HIRE">No Hire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Evaluation Notes</label>
                <textarea rows={3} className="w-full rounded-xl border border-gray-200 p-2 text-xs" value={evalFeedback} onChange={(e) => setEvalFeedback(e.target.value)} placeholder="Technical competencies, cultural alignment, architecture review notes..." />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowEvalModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmitEvaluation}>Save Evaluation</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Launch Campaign */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#062224] mb-4">Launch Recruitment Campaign</h3>
            <div className="space-y-3">
              <Input label="Campaign Name" placeholder="e.g. Q4 Engineering Spotlight" value={campName} onChange={(e) => setCampName(e.target.value)} />
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Promoted Position (Optional)</label>
                <select value={campJobId} onChange={(e) => setCampJobId(e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 text-xs">
                  <option value="">General Brand Awareness</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              <Input label="Total Budget ($)" type="number" value={campBudget} onChange={(e) => setCampBudget(e.target.value)} />
              <Input label="Daily Budget ($)" type="number" value={campDailyBudget} onChange={(e) => setCampDailyBudget(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreateCampaignModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateCampaign}>Launch</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite Team Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#062224] mb-2">Invite Company Team Member</h3>
            <p className="text-xs text-gray-500 mb-4">Assign Recruiter, Hiring Manager, or Ads Manager roles</p>
            <div className="space-y-4">
              <Input label="Member Email" type="email" placeholder="colleague@yourcompany.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Assigned Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-medium">
                  <option value={UserRole.RECRUITER}>Recruiter (Post jobs, manage pipeline)</option>
                  <option value={UserRole.HIRING_MANAGER}>Hiring Manager (Review candidates, evaluations)</option>
                  <option value={UserRole.ADS_MANAGER}>Ads Manager (Promoted jobs, budgets)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleInviteMember}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
