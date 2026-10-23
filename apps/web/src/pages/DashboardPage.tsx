import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { UserRole } from '@antigravite/types';
import { Button } from '../components/common/Button';
import { AvatarUpload } from '../components/common/AvatarUpload';
import { Input } from '../components/common/Input';
import {
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase,
  Globe,
  Building,
  CheckCircle,
  TrendingUp,
  X,
  Edit3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, candidateProfile, companyProfile, fetchMe, setCandidateProfile, setCompanyProfile } =
    useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Edit fields
  const [editFullName, setEditFullName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSalaryMin, setEditSalaryMin] = useState<number | ''>('');
  const [editSalaryMax, setEditSalaryMax] = useState<number | ''>('');

  const [editCompanyName, setEditCompanyName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const openEditModal = () => {
    if (candidateProfile) {
      setEditFullName(candidateProfile.fullName || '');
      setEditHeadline(candidateProfile.headline || '');
      setEditBio(candidateProfile.bio || '');
      setEditLocation(candidateProfile.location || '');
      setEditSalaryMin(candidateProfile.expectedSalaryMin || '');
      setEditSalaryMax(candidateProfile.expectedSalaryMax || '');
    } else if (companyProfile) {
      setEditCompanyName(companyProfile.name || '');
      setEditWebsite(companyProfile.website || '');
      setEditIndustry(companyProfile.industry || '');
      setEditDescription(companyProfile.description || '');
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    try {
      if (user?.role === UserRole.CANDIDATE) {
        const res = await apiClient.put('/profile/candidate', {
          fullName: editFullName,
          headline: editHeadline,
          bio: editBio,
          location: editLocation,
          expectedSalaryMin: editSalaryMin ? Number(editSalaryMin) : undefined,
          expectedSalaryMax: editSalaryMax ? Number(editSalaryMax) : undefined,
        });
        setCandidateProfile(res.data.data);
      } else {
        const res = await apiClient.put('/profile/company', {
          name: editCompanyName,
          website: editWebsite,
          industry: editIndustry,
          description: editDescription,
        });
        setCompanyProfile(res.data.data);
      }
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const isCandidate = user?.role === UserRole.CANDIDATE;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#062224] via-[#14595c] to-[#269194] text-white pt-10 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-5">
            {/* Avatar / Logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#60d1d4] text-[#062224] overflow-hidden border-4 border-white/20 shadow-xl flex items-center justify-center font-extrabold text-2xl">
                {(isCandidate ? candidateProfile?.avatarUrl : companyProfile?.logoUrl) ? (
                  <img
                    src={(isCandidate ? candidateProfile?.avatarUrl : companyProfile?.logoUrl)!}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (isCandidate ? candidateProfile?.fullName : companyProfile?.name)?.charAt(0) || 'A'
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isCandidate
                    ? candidateProfile?.fullName || 'Welcome, Candidate'
                    : companyProfile?.name || 'Welcome, Employer'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#60d1d4] text-[#062224] uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-[#b1f0ee] mt-1">
                {isCandidate
                  ? candidateProfile?.headline || 'Ready for precision AI job matching'
                  : companyProfile?.industry || 'Ready to discover top matched talent'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={openEditModal}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md shadow-[#60d1d4]/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                AI Match Readiness
              </p>
              <h3 className="text-2xl font-extrabold text-[#062224] mt-1">98%</h3>
              <p className="text-[11px] text-[#3eb8bb] font-semibold mt-0.5">
                Profile Optimized
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#e2f7f9] text-[#3eb8bb] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md shadow-[#60d1d4]/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isCandidate ? 'Matched Roles' : 'Qualified Candidates'}
              </p>
              <h3 className="text-2xl font-extrabold text-[#062224] mt-1">
                {isCandidate ? '14 Opportunities' : '42 Matches'}
              </h3>
              <p className="text-[11px] text-green-600 font-semibold mt-0.5">
                +6 new today
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md shadow-[#60d1d4]/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Location Preference
              </p>
              <h3 className="text-base font-bold text-[#062224] mt-1 truncate max-w-[150px]">
                {isCandidate
                  ? candidateProfile?.location || 'Remote'
                  : companyProfile?.location || 'San Francisco'}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {isCandidate ? candidateProfile?.jobTypePreference || 'Full Time' : 'Headquarters'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#e2f7f9] text-[#269194] flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-md shadow-[#60d1d4]/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isCandidate ? 'Salary Expectation' : 'Company Size'}
              </p>
              <h3 className="text-lg font-bold text-[#062224] mt-1">
                {isCandidate
                  ? `$${(candidateProfile?.expectedSalaryMin || 80000) / 1000}k - $${(candidateProfile?.expectedSalaryMax || 130000) / 1000}k`
                  : `${companyProfile?.size || '11-50'} Team`}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {isCandidate ? 'USD / Year' : 'Employees'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              {isCandidate ? <DollarSign className="w-6 h-6" /> : <Building className="w-6 h-6" />}
            </div>
          </div>
        </div>

        {/* Detailed Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / Description Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#062224]">
                  {isCandidate ? 'Candidate Bio & Background' : 'Company Mission & Overview'}
                </h2>
                <span className="text-xs text-[#3eb8bb] font-semibold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-[#3eb8bb]" /> Active Profile
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {isCandidate
                  ? candidateProfile?.bio ||
                    'Full-stack software developer with expertise in modern web and mobile applications. Focused on scalable architectures, high performance, and AI-driven workflows.'
                  : companyProfile?.description ||
                    'Innovative technology company building the future of AI-powered workflows and talent matching platforms.'}
              </p>

              {/* Candidate Skills Section */}
              {isCandidate && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-[#062224] uppercase tracking-wider mb-3">
                    Verified Competencies & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(candidateProfile?.skills?.length
                      ? candidateProfile.skills
                      : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Flutter']
                    ).map((skill) => (
                      <span
                        key={skill}
                        className="px-3.5 py-1.5 rounded-xl bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee] text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Website Link */}
              {!isCandidate && companyProfile?.website && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center space-x-2 text-sm text-[#062224]">
                  <Globe className="w-4 h-4 text-[#3eb8bb]" />
                  <a
                    href={companyProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#3eb8bb] hover:underline"
                  >
                    {companyProfile.website}
                  </a>
                </div>
              )}
            </div>

            {/* AI Matching Stream Placeholder */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#062224]">
                    {isCandidate ? 'Top AI Recommendations' : 'Candidate Talent Pipeline'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Powered by AntiGravite Semantic Vector Matching
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#d1f4f3] text-[#062224] text-xs font-bold">
                  Phase 2 Preview
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-[#e2f7f9]/40 border border-gray-100 flex items-center justify-between hover:border-[#60d1d4] transition-all"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#60d1d4]/30 text-[#062224] flex items-center justify-center font-bold text-sm">
                        {isCandidate ? <Briefcase className="w-5 h-5 text-[#269194]" /> : <Building className="w-5 h-5 text-[#269194]" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#062224]">
                          {isCandidate
                            ? `Senior Full Stack AI Engineer #${idx}`
                            : `Principal Frontend Specialist #${idx}`}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isCandidate
                            ? 'San Francisco (Hybrid) • $140,000 - $180,000'
                            : '8+ yrs exp • React, TypeScript, GraphQL'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#269194] bg-[#d1f4f3] px-3 py-1 rounded-full">
                      9{7 - idx}% Match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Account Status & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-[#062224] uppercase tracking-wider mb-4">
                Account Security & Credentials
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email Address</span>
                  <span className="font-semibold text-[#062224]">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Selected Role</span>
                  <span className="font-semibold text-[#062224]">{user?.role}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email Verified</span>
                  <span className="font-semibold text-green-600">
                    {user?.isEmailVerified ? 'Yes' : 'Pending verification'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Session Security</span>
                  <span className="font-semibold text-[#062224]">JWT + Refresh Cookie</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#60d1d4] to-[#3eb8bb] text-[#062224] rounded-3xl p-6 shadow-lg shadow-[#60d1d4]/30">
              <h3 className="font-extrabold text-base mb-1">
                Phase 1 Complete! 🎉
              </h3>
              <p className="text-xs text-[#062224]/80 leading-relaxed mb-4">
                Your authentication, JWT sessions, role-based controls, profile schemas, and S3 storage are live.
              </p>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#062224]" />
                  <span>Access Token (15 min) & Refresh Token (7 days)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#062224]" />
                  <span>PostgreSQL Database with Prisma ORM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#062224]" />
                  <span>Avatar upload support (S3 + fallback)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-[#062224]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#062224]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#062224] mb-4">
              Edit {isCandidate ? 'Candidate Profile' : 'Company Profile'}
            </h2>

            {/* Avatar upload inside modal */}
            <div className="mb-6 flex justify-center">
              <AvatarUpload
                currentUrl={isCandidate ? candidateProfile?.avatarUrl : companyProfile?.logoUrl}
                onUploaded={(url) => {
                  if (isCandidate && candidateProfile) {
                    setCandidateProfile({ ...candidateProfile, avatarUrl: url });
                  } else if (companyProfile) {
                    setCompanyProfile({ ...companyProfile, logoUrl: url });
                  }
                }}
              />
            </div>

            <div className="space-y-4">
              {isCandidate ? (
                <>
                  <Input
                    label="Full Name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                  <Input
                    label="Headline"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-1.5">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#60d1d4] focus:ring-2 focus:ring-[#d1f4f3]"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Salary Min ($/yr)"
                      type="number"
                      value={editSalaryMin}
                      onChange={(e) => setEditSalaryMin(e.target.value ? Number(e.target.value) : '')}
                    />
                    <Input
                      label="Salary Max ($/yr)"
                      type="number"
                      value={editSalaryMax}
                      onChange={(e) => setEditSalaryMax(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Input
                    label="Company Name"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                  />
                  <Input
                    label="Website"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                  />
                  <Input
                    label="Industry"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#60d1d4] focus:ring-2 focus:ring-[#d1f4f3]"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveProfile}
                  isLoading={editLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
