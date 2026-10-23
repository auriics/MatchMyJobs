import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/axios';
import { UserRole, JobTypePreference, CompanySize } from '@antigravite/types';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { AvatarUpload } from '../components/common/AvatarUpload';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Flutter',
  'AWS',
  'PostgreSQL',
  'Docker',
  'GraphQL',
  'Go',
  'Machine Learning',
  'Product Design',
];

export const OnboardingPage: React.FC = () => {
  const { user, setCandidateProfile, setCompanyProfile } = useAuthStore();
  const navigate = useNavigate();

  const isCandidate = user?.role === UserRole.CANDIDATE;
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Candidate Form State
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState('');
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<number | ''>(80000);
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<number | ''>(130000);
  const [jobTypePreference, setJobTypePreference] = useState<JobTypePreference>('FULL_TIME');

  // Company Form State
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState<CompanySize>('11-50');
  const [description, setDescription] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
  const [companyLocation, setCompanyLocation] = useState('');

  // Skills handler
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Submit Handler
  const handleComplete = async () => {
    setServerError(null);
    setLoading(true);

    try {
      if (isCandidate) {
        const payload = {
          fullName: fullName.trim() || user?.email.split('@')[0] || 'Candidate',
          headline: headline.trim() || undefined,
          bio: bio.trim() || undefined,
          skills: skills.length > 0 ? skills : ['Software Engineering'],
          location: location.trim() || 'Remote',
          expectedSalaryMin: expectedSalaryMin ? Number(expectedSalaryMin) : undefined,
          expectedSalaryMax: expectedSalaryMax ? Number(expectedSalaryMax) : undefined,
          salaryCurrency: 'USD',
          jobTypePreference,
          avatarUrl: avatarUrl || undefined,
        };

        const res = await apiClient.post('/profile/candidate', payload);
        setCandidateProfile(res.data.data);
      } else {
        const payload = {
          name: companyName.trim() || 'My Company',
          website: website.trim() || undefined,
          industry: industry.trim() || 'Technology',
          size: companySize,
          description: description.trim() || undefined,
          logoUrl: companyLogoUrl || undefined,
          location: companyLocation.trim() || 'San Francisco, CA',
        };

        const res = await apiClient.post('/profile/company', payload);
        setCompanyProfile(res.data.data);
      }

      navigate('/dashboard');
    } catch (err: any) {
      setServerError(
        err.response?.data?.error?.message ||
          'Failed to save profile. Please check all fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e2f7f9]/50 via-white to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d1f4f3] text-[#062224] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#3eb8bb]" />
            <span>Setup Your Profile</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#062224] tracking-tight">
            {isCandidate ? 'Candidate Onboarding' : 'Company Onboarding'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isCandidate
              ? 'Complete your profile to unlock precision AI job matching'
              : 'Setup your organization profile to start discovering top talent'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-[#60d1d4] -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />

            {[1, 2, 3].map((s) => {
              const isPast = s < step;
              const isCurrent = s === step;
              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      isPast
                        ? 'bg-[#3eb8bb] text-white shadow-md'
                        : isCurrent
                        ? 'bg-[#60d1d4] text-[#062224] ring-4 ring-[#d1f4f3] shadow-md'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500 mt-2">
                    {s === 1 ? 'Basics' : s === 2 ? (isCandidate ? 'Skills' : 'Details') : 'Preferences'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-[#60d1d4]/10">
          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              {serverError}
            </div>
          )}

          {/* CANDIDATE STEPS */}
          {isCandidate && (
            <div>
              {/* Step 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <AvatarUpload
                      currentUrl={avatarUrl}
                      onUploaded={(url) => setAvatarUrl(url)}
                      label="Upload Candidate Avatar"
                    />
                  </div>

                  <Input
                    label="Full Name"
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <Input
                    label="Professional Headline"
                    placeholder="e.g. Senior Full-Stack Engineer | React & Node.js"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-1.5">
                      Bio & Background Summary
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 p-3.5 text-sm text-[#062224] placeholder-gray-400 focus:outline-none focus:border-[#60d1d4] focus:ring-2 focus:ring-[#d1f4f3]"
                      placeholder="Highlight your experience, notable projects, and what drives you..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Skills & Location */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-1.5">
                      Core Skills & Tech Stack
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type a skill (e.g. TypeScript, PyTorch, GraphQL)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill(skillInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addSkill(skillInput)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Added skills tags */}
                    <div className="flex flex-wrap gap-2 mt-3 min-h-[44px] p-2 bg-[#e2f7f9]/50 rounded-xl border border-[#d1f4f3]">
                      {skills.length === 0 ? (
                        <span className="text-xs text-gray-400 italic p-1">
                          No skills added yet. Click suggestions below or type your own.
                        </span>
                      ) : (
                        skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#60d1d4] text-[#062224] shadow-xs"
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => removeSkill(s)}
                              className="ml-1.5 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Popular skills suggestions */}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">
                        Quick Add Suggestions:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SKILLS.map((item) => (
                          <button
                            type="button"
                            key={item}
                            onClick={() => addSkill(item)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#d1f4f3] text-gray-700 hover:text-[#062224] transition-colors"
                          >
                            + {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Current Location"
                    placeholder="e.g. New York, NY (or Remote - US)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Step 3: Preferences */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-2">
                      Job Type Preference
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'FULL_TIME', label: 'Full Time' },
                        { id: 'REMOTE', label: 'Fully Remote' },
                        { id: 'CONTRACT', label: 'Contract' },
                        { id: 'PART_TIME', label: 'Part Time' },
                        { id: 'INTERNSHIP', label: 'Internship' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setJobTypePreference(item.id as JobTypePreference)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                            jobTypePreference === item.id
                              ? 'border-[#60d1d4] bg-[#e2f7f9] text-[#062224] shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Expected Salary Min ($ USD/yr)"
                      type="number"
                      placeholder="80000"
                      value={expectedSalaryMin}
                      onChange={(e) => setExpectedSalaryMin(e.target.value ? Number(e.target.value) : '')}
                    />

                    <Input
                      label="Expected Salary Max ($ USD/yr)"
                      type="number"
                      placeholder="130000"
                      value={expectedSalaryMax}
                      onChange={(e) => setExpectedSalaryMax(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPANY STEPS */}
          {!isCandidate && (
            <div>
              {/* Step 1: Company Basics */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <AvatarUpload
                      currentUrl={companyLogoUrl}
                      onUploaded={(url) => setCompanyLogoUrl(url)}
                      label="Upload Company Logo"
                    />
                  </div>

                  <Input
                    label="Company Name"
                    placeholder="e.g. Acme AI Technologies"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />

                  <Input
                    label="Official Website"
                    placeholder="https://acme.ai"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              )}

              {/* Step 2: Industry & Organization */}
              {step === 2 && (
                <div className="space-y-6">
                  <Input
                    label="Industry / Domain"
                    placeholder="e.g. Artificial Intelligence, FinTech, HealthTech"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-2">
                      Company Size
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(['1-10', '11-50', '51-200', '201-500', '500+'] as CompanySize[]).map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => setCompanySize(size)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                            companySize === size
                              ? 'border-[#60d1d4] bg-[#e2f7f9] text-[#062224] shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {size} employees
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Headquarters Location"
                    placeholder="e.g. San Francisco, CA or Remote First"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Step 3: Description & Mission */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-[#062224] uppercase tracking-wider mb-1.5">
                      Company Overview & Culture
                    </label>
                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-gray-200 p-3.5 text-sm text-[#062224] placeholder-gray-400 focus:outline-none focus:border-[#60d1d4] focus:ring-2 focus:ring-[#d1f4f3]"
                      placeholder="Share your mission, culture, and what makes working at your company exceptional..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(step - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(step + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {step + 1}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleComplete}
                isLoading={loading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
