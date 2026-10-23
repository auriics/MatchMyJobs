import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/avatar_picker.dart';
import '../../auth/providers/auth_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 0;
  static const int _totalSteps = 3;

  // Candidate fields
  final _nameController = TextEditingController();
  final _headlineController = TextEditingController();
  final _bioController = TextEditingController();
  final _locationController = TextEditingController();
  final _skillInputController = TextEditingController();
  final List<String> _skills = ['React', 'TypeScript', 'Node.js'];
  String? _avatarUrl;
  String _jobTypePreference = 'FULL_TIME';
  double _salaryMin = 80000;
  double _salaryMax = 140000;

  // Company fields
  final _companyNameController = TextEditingController();
  final _websiteController = TextEditingController();
  final _industryController = TextEditingController();
  final _companyLocationController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _companySize = '11-50';
  String? _logoUrl;

  @override
  void dispose() {
    _nameController.dispose();
    _headlineController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _skillInputController.dispose();
    _companyNameController.dispose();
    _websiteController.dispose();
    _industryController.dispose();
    _companyLocationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _addSkill(String skill) {
    final trimmed = skill.trim();
    if (trimmed.isNotEmpty && !_skills.contains(trimmed)) {
      setState(() {
        _skills.add(trimmed);
        _skillInputController.clear();
      });
    }
  }

  Future<void> _handleFinish() async {
    final authState = ref.read(authStateProvider);
    final isCandidate = authState.user?.role == UserRole.CANDIDATE;

    bool ok = false;
    if (isCandidate) {
      final payload = {
        'fullName': _nameController.text.trim().isNotEmpty
            ? _nameController.text.trim()
            : 'Candidate',
        if (_headlineController.text.isNotEmpty)
          'headline': _headlineController.text.trim(),
        if (_bioController.text.isNotEmpty) 'bio': _bioController.text.trim(),
        'skills': _skills.isNotEmpty ? _skills : ['Software Engineering'],
        'location': _locationController.text.trim().isNotEmpty
            ? _locationController.text.trim()
            : 'Remote',
        'expectedSalaryMin': _salaryMin.toInt(),
        'expectedSalaryMax': _salaryMax.toInt(),
        'salaryCurrency': 'USD',
        'jobTypePreference': _jobTypePreference,
        if (_avatarUrl != null) 'avatarUrl': _avatarUrl,
      };

      ok = await ref.read(authStateProvider.notifier).saveCandidateProfile(payload);
    } else {
      final payload = {
        'name': _companyNameController.text.trim().isNotEmpty
            ? _companyNameController.text.trim()
            : 'My Company',
        if (_websiteController.text.isNotEmpty)
          'website': _websiteController.text.trim(),
        'industry': _industryController.text.trim().isNotEmpty
            ? _industryController.text.trim()
            : 'Technology',
        'size': _companySize,
        if (_descriptionController.text.isNotEmpty)
          'description': _descriptionController.text.trim(),
        if (_logoUrl != null) 'logoUrl': _logoUrl,
        'location': _companyLocationController.text.trim().isNotEmpty
            ? _companyLocationController.text.trim()
            : 'San Francisco, CA',
      };

      ok = await ref.read(authStateProvider.notifier).saveCompanyProfile(payload);
    }

    if (ok && mounted) {
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isCandidate = authState.user?.role == UserRole.CANDIDATE;
    final isLoading = authState.status == AuthStatus.loading;

    return Scaffold(
      appBar: AppBar(
        title: Text(isCandidate ? 'Candidate Setup' : 'Company Setup'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Row(
                children: List.generate(_totalSteps, (index) {
                  final isDone = index <= _currentStep;
                  return Expanded(
                    child: Container(
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: isDone ? AppColors.primary : AppColors.tint3,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  );
                }),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: isCandidate ? _buildCandidateSteps() : _buildCompanySteps(),
              ),
            ),

            // Navigation Controls
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.borderSubtle)),
              ),
              child: Row(
                children: [
                  if (_currentStep > 0) ...[
                    Expanded(
                      flex: 1,
                      child: AppButton(
                        text: 'Back',
                        variant: AppButtonVariant.secondary,
                        onPressed: () {
                          setState(() {
                            _currentStep--;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    flex: 2,
                    child: AppButton(
                      text: _currentStep < _totalSteps - 1 ? 'Next Step' : 'Finish Setup',
                      isLoading: isLoading,
                      onPressed: () {
                        if (_currentStep < _totalSteps - 1) {
                          setState(() {
                            _currentStep++;
                          });
                        } else {
                          _handleFinish();
                        }
                      },
                      rightIcon: const Icon(
                        Icons.arrow_forward_rounded,
                        color: AppColors.textPrimary,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCandidateSteps() {
    switch (_currentStep) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: AvatarPicker(
                initialUrl: _avatarUrl,
                onUploaded: (url) {
                  setState(() {
                    _avatarUrl = url;
                  });
                },
              ),
            ),
            const SizedBox(height: 24),
            AppTextField(
              label: 'Full Name',
              hintText: 'e.g. Alex Morgan',
              controller: _nameController,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Professional Headline',
              hintText: 'e.g. Senior Mobile Engineer (Flutter & iOS)',
              controller: _headlineController,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Bio / Summary',
              hintText: 'Share a brief summary of your background and achievements...',
              controller: _bioController,
              maxLines: 4,
            ),
          ],
        );

      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SKILLS & COMPETENCIES',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _skillInputController,
                    onSubmitted: _addSkill,
                    decoration: const InputDecoration(
                      hintText: 'Add skill (e.g. Dart, Flutter, AWS)',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(Icons.add, color: AppColors.textPrimary),
                  onPressed: () => _addSkill(_skillInputController.text),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _skills.map((skill) {
                return Chip(
                  backgroundColor: AppColors.tint3,
                  side: const BorderSide(color: AppColors.primary),
                  label: Text(
                    skill,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  deleteIcon: const Icon(Icons.close, size: 14),
                  onDeleted: () {
                    setState(() {
                      _skills.remove(skill);
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            AppTextField(
              label: 'Current Location',
              hintText: 'e.g. San Francisco, CA (or Remote)',
              controller: _locationController,
              prefixIcon: const Icon(Icons.location_on_outlined),
            ),
          ],
        );

      case 2:
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'JOB TYPE PREFERENCE',
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
              children: [
                ('FULL_TIME', 'Full Time'),
                ('REMOTE', 'Fully Remote'),
                ('CONTRACT', 'Contract'),
                ('PART_TIME', 'Part Time'),
              ].map((item) {
                final isSelected = _jobTypePreference == item.$1;
                return ChoiceChip(
                  label: Text(item.$2),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 12,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _jobTypePreference = item.$1;
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            const Text(
              'EXPECTED SALARY RANGE (USD / YEAR)',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.tint3,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.accent),
              ),
              child: Column(
                children: [
                  Text(
                    '\$${(_salaryMin / 1000).toInt()}k – \$${(_salaryMax / 1000).toInt()}k',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  RangeSlider(
                    values: RangeValues(_salaryMin, _salaryMax),
                    min: 40000,
                    max: 250000,
                    divisions: 42,
                    activeColor: AppColors.primaryDark,
                    inactiveColor: Colors.white,
                    onChanged: (values) {
                      setState(() {
                        _salaryMin = values.start;
                        _salaryMax = values.end;
                      });
                    },
                  ),
                ],
              ),
            ),
          ],
        );
    }
  }

  Widget _buildCompanySteps() {
    switch (_currentStep) {
      case 0:
        return Column(
          children: [
            Center(
              child: AvatarPicker(
                initialUrl: _logoUrl,
                label: 'Upload Company Logo',
                onUploaded: (url) {
                  setState(() {
                    _logoUrl = url;
                  });
                },
              ),
            ),
            const SizedBox(height: 24),
            AppTextField(
              label: 'Company Name',
              hintText: 'e.g. Match My Jobs Corp',
              controller: _companyNameController,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Website',
              hintText: 'https://company.ai',
              controller: _websiteController,
              keyboardType: TextInputType.url,
            ),
          ],
        );

      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTextField(
              label: 'Industry / Domain',
              hintText: 'e.g. Artificial Intelligence, FinTech, SaaS',
              controller: _industryController,
            ),
            const SizedBox(height: 20),
            const Text(
              'COMPANY SIZE',
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
              children: ['1-10', '11-50', '51-200', '201-500', '500+'].map((size) {
                final isSelected = _companySize == size;
                return ChoiceChip(
                  label: Text('$size team'),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: Colors.white,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _companySize = size;
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            AppTextField(
              label: 'Headquarters Location',
              hintText: 'e.g. New York, NY or Remote First',
              controller: _companyLocationController,
            ),
          ],
        );

      case 2:
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTextField(
              label: 'Company Description & Culture',
              hintText: 'Describe your vision, mission, and the kind of talent you want to attract...',
              controller: _descriptionController,
              maxLines: 6,
            ),
          ],
        );
    }
  }
}
