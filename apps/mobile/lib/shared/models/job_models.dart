class JobModel {
  final String id;
  final String title;
  final String description;
  final List<String> requirements;
  final String? department;
  final String? location;
  final String workplaceType;
  final String jobType;
  final int? salaryMin;
  final int? salaryMax;
  final String status;
  final String? organizationName;
  final String? organizationLogo;
  final DateTime? createdAt;

  JobModel({
    required this.id,
    required this.title,
    required this.description,
    this.requirements = const [],
    this.department,
    this.location,
    this.workplaceType = 'REMOTE',
    this.jobType = 'FULL_TIME',
    this.salaryMin,
    this.salaryMax,
    this.status = 'ACTIVE',
    this.organizationName,
    this.organizationLogo,
    this.createdAt,
  });

  factory JobModel.fromJson(Map<String, dynamic> json) {
    return JobModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      requirements: (json['requirements'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      department: json['department'] as String?,
      location: json['location'] as String?,
      workplaceType: json['workplaceType'] as String? ?? 'REMOTE',
      jobType: json['jobType'] as String? ?? 'FULL_TIME',
      salaryMin: json['salaryMin'] as int?,
      salaryMax: json['salaryMax'] as int?,
      status: json['status'] as String? ?? 'ACTIVE',
      organizationName: json['organizationName'] as String? ??
          (json['organization'] is Map ? json['organization']['name'] : null),
      organizationLogo: json['organizationLogo'] as String? ??
          (json['organization'] is Map ? json['organization']['logoUrl'] : null),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

class JobMatchModel {
  final String id;
  final String jobId;
  final String candidateId;
  final double score;
  final String reason;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final JobModel? job;

  JobMatchModel({
    required this.id,
    required this.jobId,
    required this.candidateId,
    required this.score,
    required this.reason,
    this.matchedSkills = const [],
    this.missingSkills = const [],
    this.job,
  });

  factory JobMatchModel.fromJson(Map<String, dynamic> json) {
    return JobMatchModel(
      id: json['id'] as String? ?? '',
      jobId: json['jobId'] as String? ?? '',
      candidateId: json['candidateId'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      reason: json['reason'] as String? ?? '',
      matchedSkills: (json['matchedSkills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      missingSkills: (json['missingSkills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      job: json['job'] != null
          ? JobModel.fromJson(json['job'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ParsedResumeModel {
  final String? name;
  final String? email;
  final String? phone;
  final String? summary;
  final List<String> skills;
  final List<Map<String, dynamic>> experience;
  final List<Map<String, dynamic>> education;
  final List<String> languages;
  final List<String> certifications;

  ParsedResumeModel({
    this.name,
    this.email,
    this.phone,
    this.summary,
    this.skills = const [],
    this.experience = const [],
    this.education = const [],
    this.languages = const [],
    this.certifications = const [],
  });

  factory ParsedResumeModel.fromJson(Map<String, dynamic> json) {
    return ParsedResumeModel(
      name: json['name'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      summary: json['summary'] as String?,
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      experience: (json['experience'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      education: (json['education'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      languages: (json['languages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      certifications: (json['certifications'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}
