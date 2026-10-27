import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '@antigravite/types';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Building,
  ArrowLeft,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/jobs/${id}`);
        setJob(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Job listing not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== UserRole.CANDIDATE) {
      alert('Only candidates can apply for jobs.');
      return;
    }

    setApplying(true);
    try {
      await apiClient.post('/candidate/apply', {
        jobId: job.id,
        coverLetter,
      });
      setHasApplied(true);
      setShowApplyModal(false);
      alert('Application submitted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#269194]" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-md w-full">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#062224] mb-2">Job Listing Not Found</h2>
          <p className="text-xs text-gray-500 mb-6">{error || 'This job may have been archived or removed.'}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(job.description || '');

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#062224] via-[#14595c] to-[#269194] text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-semibold text-[#b1f0ee] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white text-[#062224] flex items-center justify-center font-black text-2xl shadow-lg shrink-0 overflow-hidden">
                {job.organization?.logoUrl ? (
                  <img
                    src={job.organization.logoUrl}
                    alt={job.organization.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building className="w-8 h-8 text-[#269194]" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-[#b1f0ee]">
                    {job.organization?.name || 'MatchMyJobs Verified Partner'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      job.status === 'ACTIVE'
                        ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                        : job.status === 'ARCHIVED'
                        ? 'bg-gray-400/20 text-gray-300'
                        : 'bg-amber-400/20 text-amber-200'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-200 mt-2">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#60d1d4]" />
                    {job.location || 'Remote'} ({job.workplaceType || 'REMOTE'})
                  </span>
                  <span className="flex items-center">
                    <Briefcase className="w-3.5 h-3.5 mr-1 text-[#60d1d4]" />
                    {job.jobType?.replace('_', ' ') || 'Full Time'}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-3.5 h-3.5 mr-1 text-[#60d1d4]" />
                    ${job.salaryMin ? `${Math.round(job.salaryMin / 1000)}k` : '80k'} - $
                    {job.salaryMax ? `${Math.round(job.salaryMax / 1000)}k` : '130k'} / yr
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Job link copied to clipboard!');
                }}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={hasApplied || job.status !== 'ACTIVE'}
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setShowApplyModal(true);
                  }
                }}
              >
                {hasApplied ? 'Applied' : 'Apply Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Description & Requirements */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-[#062224] mb-4">Job Description</h2>
              {isHtml ? (
                <div
                  className="prose prose-sm max-w-none text-xs text-gray-600 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                  {job.description}
                </p>
              )}
            </div>

            {/* Requirements & Competencies */}
            {job.requirements?.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-[#062224] mb-3">
                  Required Competencies & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req: string) => (
                    <span
                      key={req}
                      className="px-3 py-1.5 rounded-xl bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee] text-xs font-semibold flex items-center"
                    >
                      <Sparkles className="w-3 h-3 text-[#269194] mr-1.5" />
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Company & Summary Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#062224] uppercase tracking-wider">
                Position Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Department</span>
                  <span className="font-semibold text-[#062224]">
                    {job.department || 'Engineering'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Workplace</span>
                  <span className="font-semibold text-[#062224]">
                    {job.workplaceType || 'Remote'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Employment Type</span>
                  <span className="font-semibold text-[#062224]">
                    {job.jobType?.replace('_', ' ') || 'Full Time'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Compensation</span>
                  <span className="font-semibold text-emerald-600">
                    ${job.salaryMin ? `${Math.round(job.salaryMin / 1000)}k` : '80k'} - $
                    {job.salaryMax ? `${Math.round(job.salaryMax / 1000)}k` : '130k'}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Posted</span>
                  <span className="font-semibold text-gray-700">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={hasApplied || job.status !== 'ACTIVE'}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                    } else {
                      setShowApplyModal(true);
                    }
                  }}
                >
                  {hasApplied ? 'Applied' : 'Apply For Position'}
                </Button>
              </div>
            </div>

            {/* Company Info Card */}
            {job.organization && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-[#062224]">About the Employer</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e2f7f9] flex items-center justify-center text-[#269194] font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#062224]">{job.organization.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {job.organization.industry || 'Technology'} • {job.organization.size || '50-200'} employees
                    </div>
                  </div>
                </div>
                {job.organization.description && (
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {job.organization.description}
                  </p>
                )}
                {job.organization.website && (
                  <a
                    href={job.organization.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#269194] hover:underline block"
                  >
                    Visit company website →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-[#062224]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#062224]">
              Apply for {job.title}
            </h3>
            <p className="text-xs text-gray-500">
              Submit your candidate profile and optional cover letter to {job.organization?.name || 'the recruiter'}.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                Cover Note / Why you are a great fit
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Describe your background and why your skills align with this role..."
                className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-[#60d1d4]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleApply} isLoading={applying}>
                Submit Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
