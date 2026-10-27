import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/job_models.dart';
import '../../../shared/widgets/app_button.dart';
import '../../auth/providers/auth_provider.dart';

class HomeDashboardScreen extends ConsumerStatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  ConsumerState<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends ConsumerState<HomeDashboardScreen> {
  List<JobMatchModel> _matchedJobs = [];
  bool _isLoadingMatches = false;

  @override
  void initState() {
    super.initState();
    _fetchMatchedJobs();
  }

  Future<void> _fetchMatchedJobs() async {
    final user = ref.read(authStateProvider).user;
    if (user?.role != UserRole.CANDIDATE) return;

    if (mounted) {
      setState(() {
        _isLoadingMatches = true;
      });
    }

    try {
      final authService = ref.read(authServiceProvider);
      final response = await authService.apiClient.dio.get('/match/jobs');
      final data = response.data['data'] as List<dynamic>? ?? [];

      if (data.isNotEmpty) {
        if (mounted) {
          setState(() {
            _matchedJobs = data
                .map((e) => JobMatchModel.fromJson(e as Map<String, dynamic>))
                .toList();
          });
        }
      } else {
        // Compute matches via POST if none existed
        final postRes = await authService.apiClient.dio.post('/match/jobs');
        final postData = postRes.data['data'] as List<dynamic>? ?? [];
        if (mounted) {
          setState(() {
            _matchedJobs = postData
                .map((e) => JobMatchModel.fromJson(e as Map<String, dynamic>))
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('[HomeDashboardScreen] Error fetching matched jobs: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMatches = false;
        });
      }
    }
  }

  void _showJobDetail(JobModel job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.8,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                job.organizationName ?? 'MatchMyJobs Employer',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryDeep,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                job.title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${job.location ?? 'Remote'} (${job.workplaceType}) • \$${(job.salaryMin ?? 85000) ~/ 1000}k - \$${(job.salaryMax ?? 135000) ~/ 1000}k',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const Divider(height: 24),
              const Text(
                'JOB DESCRIPTION',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    job.description.replaceAll(RegExp(r'<[^>]*>'), ' ').trim(),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              AppButton(
                text: 'Apply for Position',
                onPressed: () async {
                  Navigator.of(context).pop();
                  try {
                    final authService = ref.read(authServiceProvider);
                    await authService.apiClient.dio.post('/candidate/apply', data: {
                      'jobId': job.id,
                      'coverLetter': 'Applied via mobile matching feed.',
                    });
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Application submitted successfully!'),
                          backgroundColor: AppColors.primaryDeep,
                        ),
                      );
                    }
                  } catch (_) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Failed to submit application'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final candidate = authState.candidateProfile;
    final company = authState.companyProfile;
    final isCandidate = user?.role == UserRole.CANDIDATE;

    final displayName = isCandidate
        ? (candidate?.fullName.isNotEmpty == true ? candidate!.fullName : 'Candidate')
        : (company?.name.isNotEmpty == true ? company!.name : 'Organization');

    final avatarUrl = isCandidate ? candidate?.avatarUrl : company?.logoUrl;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
            SizedBox(width: 8),
            Text(
              'Match My Jobs',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.textPrimary),
            tooltip: 'Log out',
            onPressed: () async {
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(authStateProvider.notifier).checkAuthStatus();
            await _fetchMatchedJobs();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User Hero Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF062224),
                        Color(0xFF14595C),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF062224).withValues(alpha: 0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: avatarUrl != null && avatarUrl.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: avatarUrl,
                                  fit: BoxFit.cover,
                                  errorWidget: (context, url, error) => Center(
                                    child: Text(
                                      displayName.isNotEmpty ? displayName[0] : 'A',
                                      style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                )
                              : Center(
                                  child: Text(
                                    displayName.isNotEmpty ? displayName[0] : 'A',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                user?.role.name ?? 'USER',
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              displayName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isCandidate
                                  ? (candidate?.headline ?? 'AI Job Seeker')
                                  : (company?.industry ?? 'Technology Organization'),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Quick Action Bar
                Row(
                  children: [
                    if (isCandidate) ...[
                      Expanded(
                        child: AppButton(
                          text: 'Upload Resume',
                          onPressed: () async {
                            await context.push('/resume-upload');
                            _fetchMatchedJobs();
                          },
                          leftIcon: const Icon(Icons.cloud_upload_outlined, size: 16),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: AppButton(
                        text: 'Browse Jobs',
                        variant: AppButtonVariant.outline,
                        onPressed: () {
                          context.push('/jobs');
                        },
                        leftIcon: const Icon(Icons.search, size: 16),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // AI Match Readiness Metric Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.tint3),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppColors.tint3,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.insights_rounded,
                          color: AppColors.primaryDeep,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'AI Match Readiness',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMuted,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              candidate?.skills.isNotEmpty == true ? '98% Optimized' : 'Profile Initialized',
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              isCandidate
                                  ? 'Algorithmic cosine embedding against live job listings'
                                  : 'Multi-tenant team recruitment & talent portal',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Details & Skills
                if (isCandidate && candidate != null && candidate.skills.isNotEmpty) ...[
                  const Text(
                    'YOUR VERIFIED COMPETENCIES',
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
                    children: candidate.skills.map((skill) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.tint3,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.primary),
                        ),
                        child: Text(
                          skill,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                ],

                // MODULE 3: AI MATCHED JOBS FEED
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isCandidate ? 'JOBS FOR YOU (AI MATCHED)' : 'RECENT OPPORTUNITIES',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        letterSpacing: 0.8,
                      ),
                    ),
                    if (isCandidate)
                      IconButton(
                        icon: const Icon(Icons.refresh, size: 18, color: AppColors.primaryDeep),
                        onPressed: _fetchMatchedJobs,
                      ),
                  ],
                ),
                const SizedBox(height: 6),

                if (_isLoadingMatches)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (isCandidate && _matchedJobs.isNotEmpty) ...[
                  ..._matchedJobs.map((match) {
                    final scorePct = (match.score * 100).round();
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.borderSubtle),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: InkWell(
                        onTap: () {
                          if (match.job != null) _showJobDetail(match.job!);
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    match.job?.organizationName ?? 'MatchMyJobs Partner',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primaryDeep,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: scorePct >= 80
                                        ? const Color(0xFFECFDF5)
                                        : AppColors.tint2,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: scorePct >= 80
                                          ? const Color(0xFFA7F3D0)
                                          : AppColors.primary,
                                    ),
                                  ),
                                  child: Text(
                                    '$scorePct% Match',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: scorePct >= 80
                                          ? const Color(0xFF065F46)
                                          : AppColors.primaryDeep,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              match.job?.title ?? 'Opportunity',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${match.job?.location ?? 'Remote'} • \$${(match.job?.salaryMin ?? 85000) ~/ 1000}k - \$${(match.job?.salaryMax ?? 135000) ~/ 1000}k',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),

                            // AI Reason Chip
                            if (match.reason.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: AppColors.tint3,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.auto_awesome,
                                        size: 13, color: AppColors.primaryDeep),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        match.reason,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primaryDeep,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            // Matched skills
                            if (match.matchedSkills.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: match.matchedSkills.take(3).map((s) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFECFDF5),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '✓ $s',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF065F46),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
                ] else ...[
                  // If candidate has no matches yet or company view
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.work_outline,
                            color: AppColors.textMuted, size: 36),
                        const SizedBox(height: 10),
                        Text(
                          isCandidate
                              ? 'Upload resume to generate AI job matches'
                              : 'No job listings posted yet',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          text: isCandidate ? 'Upload Resume Now' : 'Browse All Jobs',
                          onPressed: () {
                            if (isCandidate) {
                              context.push('/resume-upload');
                            } else {
                              context.push('/jobs');
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 20),
                AppButton(
                  text: 'Edit Profile Details',
                  variant: AppButtonVariant.outline,
                  onPressed: () {
                    context.push('/onboarding');
                  },
                  leftIcon: const Icon(Icons.edit_outlined, size: 18),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
