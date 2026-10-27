import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import {
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  Search,
  Bookmark,
  Calendar,
  CheckCircle,
  ExternalLink,
  Bell,
  Settings,
  Send,
  User,
  X,
  UploadCloud,
  Target,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ResumeUploadModal } from '../components/candidate/ResumeUploadModal';

export const CandidateDashboardPage: React.FC = () => {
  const { user, candidateProfile, fetchMe, setCandidateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'matched' | 'profile' | 'jobs' | 'applications' | 'saved' | 'interviews' | 'notifications' | 'settings'
  >('overview');

  // Resume Upload Modal
  const [showResumeModal, setShowResumeModal] = useState(false);

  // AI Matched Jobs State
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Search & Browse Jobs
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Applications, Saved, Interviews
  const [applications, setApplications] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  // Profile Edit State
  const [editFullName, setEditFullName] = useState(candidateProfile?.fullName || '');
  const [editHeadline, setEditHeadline] = useState(candidateProfile?.headline || '');
  const [editBio, setEditBio] = useState(candidateProfile?.bio || '');
  const [editLocation, setEditLocation] = useState(candidateProfile?.location || '');
  const [editSalaryMin, setEditSalaryMin] = useState(candidateProfile?.expectedSalaryMin || '');
  const [editSalaryMax, setEditSalaryMax] = useState(candidateProfile?.expectedSalaryMax || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!candidateProfile) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (candidateProfile) {
      setEditFullName(candidateProfile.fullName || '');
      setEditHeadline(candidateProfile.headline || '');
      setEditBio(candidateProfile.bio || '');
      setEditLocation(candidateProfile.location || '');
      setEditSalaryMin(candidateProfile.expectedSalaryMin || '');
      setEditSalaryMax(candidateProfile.expectedSalaryMax || '');
    }
  }, [candidateProfile]);

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/candidate/jobs', {
        params: { search: searchKeyword || undefined },
      });
      setJobs(res.data.data.jobs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/candidate/applications');
      setApplications(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await apiClient.get('/candidate/saved-jobs');
      setSavedJobs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInterviews = async () => {
    try {
      const res = await apiClient.get('/candidate/interviews');
      setInterviews(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatchedJobs = async () => {
    try {
      setMatchingLoading(true);
      const res = await apiClient.get('/match/jobs');
      if (res.data.data && res.data.data.length > 0) {
        setMatchedJobs(res.data.data);
      } else {
        const postRes = await apiClient.post('/match/jobs');
        setMatchedJobs(postRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch matched jobs:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'matched') fetchMatchedJobs();
    if (activeTab === 'jobs') fetchJobs();
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'saved') fetchSavedJobs();
    if (activeTab === 'interviews') fetchInterviews();
  }, [activeTab]);

  const handleApplyJob = async () => {
    if (!selectedJob) return;
    setApplyLoading(true);
    try {
      await apiClient.post('/candidate/apply', {
        jobId: selectedJob.id,
        coverLetter,
      });
      alert('Application submitted successfully!');
      setSelectedJob(null);
      setCoverLetter('');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleToggleSave = async (jobId: string) => {
    try {
      await apiClient.post('/candidate/saved-jobs/toggle', { jobId });
      if (activeTab === 'saved') fetchSavedJobs();
      else alert('Job saved to your bookmarks!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await apiClient.put('/profile/candidate', {
        fullName: editFullName,
        headline: editHeadline,
        bio: editBio,
        location: editLocation,
        expectedSalaryMin: editSalaryMin ? Number(editSalaryMin) : undefined,
        expectedSalaryMax: editSalaryMax ? Number(editSalaryMax) : undefined,
      });
      setCandidateProfile(res.data.data);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16 font-sans">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#062224] via-[#14595c] to-[#269194] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-[#60d1d4] text-[#062224] flex items-center justify-center font-black text-2xl shadow-lg shadow-black/20 overflow-hidden">
              {candidateProfile?.avatarUrl ? (
                <img src={candidateProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                candidateProfile?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">
                  {candidateProfile?.fullName || 'Welcome, Job Seeker'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#60d1d4] text-[#062224] uppercase">
                  Candidate
                </span>
              </div>
              <p className="text-sm text-[#b1f0ee] mt-0.5">
                {candidateProfile?.headline || 'Ready for precision AI job matching'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              onClick={() => setShowResumeModal(true)}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload Resume (AI)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveTab('jobs')}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Browse Open Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex flex-wrap gap-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'matched', label: `Jobs For You (${matchedJobs.length})`, icon: Target },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'jobs', label: 'Find Jobs', icon: Search },
            { id: 'applications', label: 'My Applications', icon: Briefcase },
            { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
            { id: 'interviews', label: 'Interviews', icon: Calendar },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-[#062224] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Match Readiness</span>
                  <div className="text-2xl font-extrabold text-[#062224] mt-1">98%</div>
                  <span className="text-[11px] text-[#269194] font-semibold">AI Profile Optimized</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#e2f7f9] text-[#269194] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Location Preference</span>
                  <div className="text-base font-bold text-[#062224] mt-1 truncate max-w-[140px]">
                    {candidateProfile?.location || 'Remote'}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {candidateProfile?.jobTypePreference || 'Full Time'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Salary Target</span>
                  <div className="text-base font-bold text-[#062224] mt-1">
                    ${(candidateProfile?.expectedSalaryMin || 85000) / 1000}k - ${(candidateProfile?.expectedSalaryMax || 135000) / 1000}k
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">USD / Year</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Account Status</span>
                  <div className="text-base font-bold text-green-600 mt-1 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" /> Active Candidate
                  </div>
                  <span className="text-[11px] text-gray-400">Protected Candidate Role</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Profile Summary & Skills */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-[#062224] mb-2">Candidate Background</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {candidateProfile?.bio ||
                  'Experienced software developer focused on modern web and mobile applications, resilient backend architectures, and AI-enabled product workflows.'}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-bold text-[#062224] uppercase tracking-wider mb-3">
                  Verified Technical Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(candidateProfile?.skills?.length
                    ? candidateProfile.skills
                    : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Flutter']
                  ).map((s) => (
                    <span
                      key={s}
                      className="px-3.5 py-1.5 rounded-xl bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee] text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* MODULE 3: JOBS FOR YOU (AI MATCHING SECTION ON OVERVIEW) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e2f7f9] text-[#269194] uppercase tracking-wide">
                      OpenAI Embeddings
                    </span>
                    <h2 className="text-lg font-bold text-[#062224]">Jobs For You</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recommended positions matching your skills, experience, and profile
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchMatchedJobs}
                    isLoading={matchingLoading}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Refresh Matches
                  </Button>
                </div>
              </div>

              {/* Matched Jobs Grid */}
              {matchingLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : matchedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedJobs.slice(0, 4).map((match) => {
                    const scorePct = Math.round(match.score * 100);
                    const isHigh = scorePct >= 80;
                    return (
                      <div
                        key={match.id}
                        className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#60d1d4] shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Score Badge & Reason Chip */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center shadow-xs ${
                                isHigh
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-[#269194] text-white'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {scorePct}% Match
                            </span>

                            <span className="text-[11px] font-medium text-gray-500">
                              {match.job?.jobType?.replace('_', ' ') || 'Full Time'}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-[#062224]">
                            {match.job?.title || 'Open Role'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {match.job?.organization?.name || 'Verified Company'} • {match.job?.location || 'Remote'}
                          </p>

                          {/* AI Reason Chip */}
                          {match.reason && (
                            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#f0fafb] border border-[#b1f0ee] text-[11px] text-[#14595c] font-medium flex items-center">
                              <Sparkles className="w-3 h-3 text-[#269194] mr-1.5 shrink-0" />
                              <span className="truncate">{match.reason}</span>
                            </div>
                          )}

                          {/* Matched Skills */}
                          {match.matchedSkills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {match.matchedSkills.slice(0, 3).map((sk: string) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                                >
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">
                            ${match.job?.salaryMin ? `${Math.round(match.job.salaryMin / 1000)}k` : '85k'} - $
                            {match.job?.salaryMax ? `${Math.round(match.job.salaryMax / 1000)}k` : '135k'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/jobs/${match.jobId}`}
                              className="text-xs font-semibold text-[#269194] hover:underline"
                            >
                              View Details
                            </Link>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedJob(match.job)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100 p-6">
                  <Sparkles className="w-8 h-8 text-[#269194] mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-[#062224]">No job matches computed yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Upload your resume or fill out your competencies so our AI can match you with available positions.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowResumeModal(true)}
                    leftIcon={<UploadCloud className="w-4 h-4" />}
                  >
                    Upload Resume Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1.5: DEDICATED MATCHED JOBS TAB */}
        {activeTab === 'matched' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#062224]">AI-Matched Opportunities</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ranked by cosine similarity between your verified skill vector and active job listing requirements.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={fetchMatchedJobs}
                isLoading={matchingLoading}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Re-calculate AI Matches
              </Button>
            </div>
            {matchedJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <Sparkles className="w-10 h-10 text-[#269194] mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#062224]">No job matches computed yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                  Upload your resume or fill out your competencies so our AI can match you with available positions.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowResumeModal(true)}
                  leftIcon={<UploadCloud className="w-4 h-4" />}
                >
                  Upload Resume Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matchedJobs.map((match) => {
                const scorePct = Math.round(match.score * 100);
                const isHigh = scorePct >= 80;
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#60d1d4] shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black shadow-xs flex items-center ${
                            isHigh ? 'bg-emerald-500 text-white' : 'bg-[#269194] text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {scorePct}% Match
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {match.job?.jobType?.replace('_', ' ') || 'Full Time'}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#062224]">{match.job?.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {match.job?.organization?.name || 'Verified Employer'} • {match.job?.location || 'Remote'}
                      </p>

                      {/* AI Reason */}
                      {match.reason && (
                        <div className="mt-3 px-3 py-2 rounded-xl bg-[#f0fafb] border border-[#b1f0ee] text-xs text-[#14595c] font-medium flex items-center">
                          <Sparkles className="w-3.5 h-3.5 text-[#269194] mr-1.5 shrink-0" />
                          <span>{match.reason}</span>
                        </div>
                      )}

                      {/* Matched & Missing Skills */}
                      <div className="mt-3 space-y-2">
                        {match.matchedSkills?.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Matched Skills</div>
                            <div className="flex flex-wrap gap-1 mt-1">
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
                        {match.missingSkills?.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Growth Opportunities</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {match.missingSkills.map((sk: string) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]"
                                >
                                  + {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        ${match.job?.salaryMin ? `${Math.round(match.job.salaryMin / 1000)}k` : '85k'} - $
                        {match.job?.salaryMax ? `${Math.round(match.job.salaryMax / 1000)}k` : '135k'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/jobs/${match.jobId}`}
                          className="text-xs font-semibold text-[#269194] hover:underline"
                        >
                          View Details
                        </Link>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setSelectedJob(match.job)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-2xl">
            <h2 className="text-lg font-bold text-[#062224] mb-1">Edit Candidate Profile</h2>
            <p className="text-xs text-gray-500 mb-6">Keep your details updated for accurate AI matching</p>

            <div className="space-y-4">
              <Input label="Full Name" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              <Input label="Headline / Current Title" value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} />
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">Bio / Background</label>
                <textarea rows={4} className="w-full rounded-xl border border-gray-200 p-3 text-xs" value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>
              <Input label="Preferred Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Expected Salary Min ($)" type="number" value={editSalaryMin} onChange={(e) => setEditSalaryMin(Number(e.target.value))} />
                <Input label="Expected Salary Max ($)" type="number" value={editSalaryMax} onChange={(e) => setEditSalaryMax(Number(e.target.value))} />
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" onClick={handleSaveProfile} isLoading={profileSaving}>
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIND JOBS */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search jobs by title, skill, or employer..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#60d1d4]"
                />
              </div>
              <Button variant="primary" onClick={fetchJobs}>
                Search
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#60d1d4] transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-[#e2f7f9] text-[#269194] flex items-center justify-center font-bold text-xs">
                          {job.organizationName?.charAt(0) || 'C'}
                        </div>
                        <span className="text-xs font-semibold text-[#062224]">{job.organizationName}</span>
                      </div>
                      <button
                        onClick={() => handleToggleSave(job.id)}
                        className="text-gray-400 hover:text-amber-500 transition-colors"
                        title="Bookmark Job"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-[#062224]">{job.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {job.location} • {job.jobType}
                    </p>
                    <p className="text-xs text-gray-600 mt-3 line-clamp-3">{job.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#269194]">
                      ${job.salaryMin ? `${job.salaryMin / 1000}k` : '80k'} - ${job.salaryMax ? `${job.salaryMax / 1000}k` : '120k'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedJob(job)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100">
                  No active job postings matched your search criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MY APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#062224]">Application Status Tracker</h2>
              <p className="text-xs text-gray-500">Live progress across your submitted job applications</p>
            </div>

            <div className="divide-y divide-gray-100">
              {applications.map((app) => (
                <div key={app.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#062224]">{app.jobTitle}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{app.organizationName} • {app.jobLocation}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Submitted on {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee]">
                      Stage: {app.status}
                    </span>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="p-12 text-center text-sm text-gray-500">
                  You have not applied for any positions yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SAVED JOBS */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedJobs.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">{item.organizationName}</span>
                      <button onClick={() => handleToggleSave(item.jobId)} className="text-red-400 hover:text-red-600 text-xs">
                        Remove
                      </button>
                    </div>
                    <h3 className="font-bold text-sm text-[#062224]">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.location} • {item.jobType}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSelectedJob({ id: item.jobId, title: item.title })}>
                    Apply Now
                  </Button>
                </div>
              ))}
              {savedJobs.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100">
                  No saved jobs in your bookmarks.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: INTERVIEWS */}
        {activeTab === 'interviews' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#062224]">Scheduled Interviews</h2>
              <p className="text-xs text-gray-500">Upcoming virtual interview sessions and meeting rooms</p>
            </div>

            <div className="divide-y divide-gray-100">
              {interviews.map((intv) => (
                <div key={intv.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#062224]">{intv.jobTitle}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{intv.companyName}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-[#269194] font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(intv.scheduledAt).toLocaleString()} ({intv.durationMinutes} min)</span>
                    </div>
                  </div>

                  <div>
                    {intv.meetingUrl && (
                      <a
                        href={intv.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#60d1d4] text-[#062224] text-xs font-bold hover:brightness-105"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {interviews.length === 0 && (
                <div className="p-12 text-center text-sm text-gray-500">
                  No interviews scheduled at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-500">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>You're all caught up! No unread notifications.</p>
          </div>
        )}

        {/* TAB 8: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-xl space-y-4">
            <h2 className="text-lg font-bold text-[#062224]">Candidate Account Settings</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Account Email</span>
                <span className="font-semibold text-[#062224]">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Role Privilege</span>
                <span className="font-semibold text-[#062224]">{user?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email Verification</span>
                <span className="font-semibold text-green-600">
                  {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Apply to Job */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#062224]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#062224] mb-1">Apply for Position</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedJob.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                  Cover Letter / Introduction Notes
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-[#60d1d4]"
                  placeholder="Explain why you are an exceptional match for this opportunity..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
                Your primary profile and resume will be submitted alongside your application.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => setSelectedJob(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleApplyJob} isLoading={applyLoading}>
                  Submit Application
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI Resume Upload & Parser */}
      <ResumeUploadModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onSuccess={() => {
          fetchMe();
          fetchMatchedJobs();
        }}
      />
    </div>
  );
};
