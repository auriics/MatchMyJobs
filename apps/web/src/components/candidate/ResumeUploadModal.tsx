import React, { useState, useRef } from 'react';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Plus,
  Building,
  GraduationCap,
  Globe,
  Award,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ParsedResumeData } from '@antigravite/types';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setCandidateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'parsing' | 'preview'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Editable parsed fields
  const [parsedData, setParsedData] = useState<ParsedResumeData>({
    name: '',
    email: '',
    phone: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    languages: [],
    certifications: [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      setError('Please select a valid PDF or DOCX resume document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be 15MB or less.');
      return;
    }

    setSelectedFile(file);
    startUploadAndParse(file);
  };

  const startUploadAndParse = async (file: File) => {
    setStep('parsing');
    setUploadProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    // Simulate steady progress while waiting for AI
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const response = await apiClient.post('/resume/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const parsed: ParsedResumeData = response.data?.data?.parsedData || {
        name: '',
        email: '',
        phone: '',
        summary: '',
        skills: [],
        experience: [],
        education: [],
        languages: [],
        certifications: [],
      };

      setParsedData({
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        summary: parsed.summary || '',
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        languages: parsed.languages || [],
        certifications: parsed.certifications || [],
      });

      if (response.data?.data?.profile) {
        setCandidateProfile(response.data.data.profile);
      }

      setTimeout(() => {
        setStep('preview');
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(
        err.response?.data?.error?.message ||
          'Failed to parse resume document. Please check the file and try again.'
      );
      setStep('upload');
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !parsedData.skills.includes(trimmed)) {
      setParsedData({
        ...parsedData,
        skills: [...parsedData.skills, trimmed],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setParsedData({
      ...parsedData,
      skills: parsedData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSaveToProfile = async () => {
    setSavingProfile(true);
    setError(null);

    try {
      const payload = {
        fullName: parsedData.name || undefined,
        headline: parsedData.summary ? parsedData.summary.slice(0, 100) : undefined,
        bio: parsedData.summary || undefined,
        skills: parsedData.skills,
        phone: parsedData.phone || undefined,
        experience: parsedData.experience,
        education: parsedData.education,
        languages: parsedData.languages,
        certifications: parsedData.certifications,
      };

      const res = await apiClient.put('/profile/candidate', payload);
      setCandidateProfile(res.data.data);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update candidate profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#062224]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#e2f7f9] text-[#269194] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#269194]" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#062224]">AI Resume Parser</h2>
              <p className="text-xs text-gray-500">
                Upload your resume in PDF/DOCX to automatically generate your verified candidate profile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#269194] bg-[#e2f7f9]/30 scale-[1.01]'
                    : 'border-gray-200 hover:border-[#60d1d4] hover:bg-gray-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 rounded-2xl bg-[#e2f7f9] text-[#269194] flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-[#062224]">
                  Drag and drop your resume here, or <span className="text-[#269194] underline">browse</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: PDF, DOCX (Max 15MB)
                </p>
              </div>

              <div className="bg-[#f0fafb] rounded-2xl p-4 border border-[#b1f0ee] flex items-start space-x-3 text-xs text-[#062224]">
                <Sparkles className="w-4 h-4 text-[#269194] shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold text-[#14595c]">Precision Extraction:</strong> Our OpenAI-powered model automatically extracts your technical skills, work history, education, and credentials so you match with high-relevance vacancies.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING SKELETON LOADER */}
          {step === 'parsing' && (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#e2f7f9] text-[#269194] text-xs font-bold animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Parsing in Progress...</span>
                </div>
                <p className="text-sm font-bold text-[#062224]">
                  Extracting structured profile data from {selectedFile?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Using GPT-4o structured extraction for high accuracy...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#269194] to-[#60d1d4] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Skeleton Cards */}
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-16 bg-gray-200 rounded w-full" />
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-6 w-20 bg-gray-200 rounded-xl" />
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & EDIT BEFORE SAVING */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    Resume successfully parsed! Review and tweak your profile before saving.
                  </span>
                </div>
                <span className="text-[11px] font-bold uppercase bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                  Ready
                </span>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={parsedData.name || ''}
                  onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  value={parsedData.phone || ''}
                  onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={3}
                  value={parsedData.summary || ''}
                  onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-[#60d1d4]"
                  placeholder="Summary of experience and background..."
                />
              </div>

              {/* Skills Tag Editor */}
              <div>
                <label className="block text-xs font-bold text-[#062224] uppercase mb-1">
                  Extracted Skills ({parsedData.skills.length})
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {parsedData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#e2f7f9] text-[#062224] border border-[#b1f0ee] text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add additional skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#60d1d4]"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddSkill}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Experience Preview */}
              {parsedData.experience?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#062224] uppercase mb-2 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1 text-[#269194]" /> Work Experience
                  </h4>
                  <div className="space-y-2">
                    {parsedData.experience.map((exp: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                      >
                        <div className="flex justify-between font-bold text-[#062224]">
                          <span>{exp.title}</span>
                          <span className="text-gray-500 font-normal">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </span>
                        </div>
                        <div className="text-gray-600 font-medium">{exp.company}</div>
                        {exp.description && (
                          <p className="text-gray-500 mt-1 line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Preview */}
              {parsedData.education?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#062224] uppercase mb-2 flex items-center">
                    <GraduationCap className="w-3.5 h-3.5 mr-1 text-[#269194]" /> Education
                  </h4>
                  <div className="space-y-2">
                    {parsedData.education.map((edu: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#062224]">{edu.degree}</div>
                          <div className="text-gray-600">{edu.institution}</div>
                        </div>
                        {edu.year && <span className="text-gray-400">{edu.year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages & Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsedData.languages?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#062224] uppercase mb-2 flex items-center">
                      <Globe className="w-3.5 h-3.5 mr-1 text-[#269194]" /> Languages
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {parsedData.languages.map((l: string) => (
                        <span
                          key={l}
                          className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.certifications?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#062224] uppercase mb-2 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1 text-[#269194]" /> Certifications
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {parsedData.certifications.map((c: string) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-gray-100 rounded text-[11px] text-gray-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                Upload different file
              </button>
              <div className="flex space-x-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveToProfile}
                  isLoading={savingProfile}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save & Auto-Fill Profile
                </Button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
