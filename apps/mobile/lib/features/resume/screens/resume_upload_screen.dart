import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/shimmer_loader.dart';
import '../../../shared/models/job_models.dart';
import '../../auth/providers/auth_provider.dart';

class ResumeUploadScreen extends ConsumerStatefulWidget {
  const ResumeUploadScreen({super.key});

  @override
  ConsumerState<ResumeUploadScreen> createState() => _ResumeUploadScreenState();
}

class _ResumeUploadScreenState extends ConsumerState<ResumeUploadScreen> {
  bool _isPicking = false;
  bool _isParsing = false;
  bool _isSaving = false;
  String? _selectedFileName;
  String? _errorMessage;

  // Parsed Data state
  ParsedResumeModel? _parsedData;
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _summaryController;
  late final TextEditingController _newSkillController;
  final List<String> _skills = [];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
    _summaryController = TextEditingController();
    _newSkillController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _summaryController.dispose();
    _newSkillController.dispose();
    super.dispose();
  }

  Future<void> _pickAndParseResume() async {
    setState(() {
      _errorMessage = null;
      _isPicking = true;
    });

    try {
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'docx', 'doc'],
      );

      if (files.isEmpty || files.first.path == null) {
        setState(() => _isPicking = false);
        return;
      }

      final file = File(files.first.path!);
      final fileName = files.first.name;

      setState(() {
        _isPicking = false;
        _isParsing = true;
        _selectedFileName = fileName;
      });

      final authService = ref.read(authServiceProvider);
      final formData = FormData.fromMap({
        'resume': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await authService.apiClient.dio.post(
        '/resume/parse',
        data: formData,
      );

      final data = response.data['data'] as Map<String, dynamic>;
      final parsedJson = (data['parsedData'] as Map<String, dynamic>?) ?? {};
      final parsed = ParsedResumeModel.fromJson(parsedJson);

      setState(() {
        _isParsing = false;
        _parsedData = parsed;
        _nameController.text = parsed.name ?? '';
        _phoneController.text = parsed.phone ?? '';
        _summaryController.text = parsed.summary ?? '';
        _skills.clear();
        _skills.addAll(parsed.skills);
      });
    } catch (e) {
      setState(() {
        _isPicking = false;
        _isParsing = false;
        _errorMessage = e is DioException
            ? (e.response?.data?['error']?['message'] ?? 'Failed to parse resume document')
            : 'Error selecting file. Please try again.';
      });
    }
  }

  void _addSkill() {
    final skill = _newSkillController.text.trim();
    if (skill.isNotEmpty && !_skills.contains(skill)) {
      setState(() {
        _skills.add(skill);
        _newSkillController.clear();
      });
    }
  }

  void _removeSkill(String skill) {
    setState(() {
      _skills.remove(skill);
    });
  }

  Future<void> _saveParsedProfile() async {
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      final payload = {
        'fullName': _nameController.text.trim(),
        'headline': _summaryController.text.isNotEmpty
            ? (_summaryController.text.length > 100
                ? _summaryController.text.substring(0, 100)
                : _summaryController.text)
            : 'Candidate',
        'bio': _summaryController.text.trim(),
        'skills': _skills,
        'phone': _phoneController.text.trim(),
        'experience': _parsedData?.experience ?? [],
        'education': _parsedData?.education ?? [],
        'languages': _parsedData?.languages ?? [],
        'certifications': _parsedData?.certifications ?? [],
      };

      await authService.updateCandidateProfile(payload);
      await ref.read(authStateProvider.notifier).checkAuthStatus();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Resume parsed and profile updated successfully!'),
            backgroundColor: AppColors.primaryDeep,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() {
        _isSaving = false;
        _errorMessage = e is DioException
            ? (e.response?.data?['error']?['message'] ?? 'Failed to update candidate profile')
            : 'An unexpected error occurred while saving profile.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text(
          'AI Resume Parser',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.red.shade900,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Upload / File Selection Card
              if (_parsedData == null && !_isParsing) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.tint3, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppColors.tint3,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: const Icon(
                          Icons.cloud_upload_outlined,
                          color: AppColors.primaryDeep,
                          size: 36,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Upload Your Resume',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Supports PDF, DOCX (up to 15MB).\nOur AI extracts your background and skills automatically.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        text: _isPicking ? 'Selecting File...' : 'Select Resume Document',
                        isLoading: _isPicking,
                        onPressed: _pickAndParseResume,
                        leftIcon: const Icon(Icons.file_present_outlined, size: 18),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.tint3.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: AppColors.primaryDeep, size: 22),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Powered by OpenAI GPT-4o structured extraction for high-precision skill matching.',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryDeep,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Shimmer Loading State while AI is parsing
              if (_isParsing) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  child: Column(
                    children: [
                      const CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryDeep),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'Parsing ${_selectedFileName ?? 'Resume'}...',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Extracting competencies, experience, and education with AI...',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 24),
                      const ShimmerLoader(width: double.infinity, height: 44),
                      const SizedBox(height: 12),
                      const ShimmerLoader(width: double.infinity, height: 80),
                      const SizedBox(height: 12),
                      const ShimmerLoader(width: double.infinity, height: 44),
                    ],
                  ),
                ),
              ],

              // Preview & Editable Fields
              if (_parsedData != null && !_isParsing) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle, color: Color(0xFF059669), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Resume parsed successfully! Review and edit your information below before saving.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF065F46),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                AppTextField(
                  label: 'Full Name',
                  controller: _nameController,
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                const SizedBox(height: 14),

                AppTextField(
                  label: 'Phone Number',
                  controller: _phoneController,
                  prefixIcon: const Icon(Icons.phone_outlined),
                ),
                const SizedBox(height: 14),

                AppTextField(
                  label: 'Professional Summary',
                  controller: _summaryController,
                  maxLines: 4,
                  prefixIcon: const Icon(Icons.description_outlined),
                ),
                const SizedBox(height: 18),

                // Skills Editor
                const Text(
                  'EXTRACTED SKILLS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _skills.map((skill) {
                    return Chip(
                      label: Text(
                        skill,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      backgroundColor: AppColors.tint3,
                      deleteIcon: const Icon(Icons.close, size: 16),
                      onDeleted: () => _removeSkill(skill),
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: AppTextField(
                        label: 'Add Custom Skill',
                        controller: _newSkillController,
                        hintText: 'e.g. Flutter, GraphQL',
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filled(
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.primaryDeep,
                      ),
                      onPressed: _addSkill,
                      icon: const Icon(Icons.add, color: Colors.white),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Experience Cards Preview
                if (_parsedData!.experience.isNotEmpty) ...[
                  const Text(
                    'WORK EXPERIENCE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ..._parsedData!.experience.map((exp) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            exp['title'] ?? 'Role',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            '${exp['company'] ?? 'Company'} • ${exp['startDate'] ?? ''} - ${exp['endDate'] ?? 'Present'}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          if (exp['description'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              exp['description'].toString(),
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textMuted,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 16),
                ],

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        text: 'Choose Another File',
                        variant: AppButtonVariant.outline,
                        onPressed: _pickAndParseResume,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppButton(
                        text: _isSaving ? 'Saving...' : 'Save & Auto-Fill',
                        isLoading: _isSaving,
                        onPressed: _saveParsedProfile,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
