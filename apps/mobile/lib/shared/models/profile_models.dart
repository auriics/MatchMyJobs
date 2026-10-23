import 'user_model.dart';

class CandidateProfileModel {
  final String id;
  final String userId;
  final String fullName;
  final String? headline;
  final String? bio;
  final List<String> skills;
  final String? location;
  final int? expectedSalaryMin;
  final int? expectedSalaryMax;
  final String? salaryCurrency;
  final String? jobTypePreference;
  final String? avatarUrl;
  final String? resumeUrl;

  CandidateProfileModel({
    required this.id,
    required this.userId,
    required this.fullName,
    this.headline,
    this.bio,
    this.skills = const [],
    this.location,
    this.expectedSalaryMin,
    this.expectedSalaryMax,
    this.salaryCurrency,
    this.jobTypePreference,
    this.avatarUrl,
    this.resumeUrl,
  });

  factory CandidateProfileModel.fromJson(Map<String, dynamic> json) {
    return CandidateProfileModel(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      headline: json['headline'] as String?,
      bio: json['bio'] as String?,
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      location: json['location'] as String?,
      expectedSalaryMin: json['expectedSalaryMin'] as int?,
      expectedSalaryMax: json['expectedSalaryMax'] as int?,
      salaryCurrency: json['salaryCurrency'] as String? ?? 'USD',
      jobTypePreference: json['jobTypePreference'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      resumeUrl: json['resumeUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'headline': headline,
      'bio': bio,
      'skills': skills,
      'location': location,
      'expectedSalaryMin': expectedSalaryMin,
      'expectedSalaryMax': expectedSalaryMax,
      'salaryCurrency': salaryCurrency,
      'jobTypePreference': jobTypePreference,
      'avatarUrl': avatarUrl,
      'resumeUrl': resumeUrl,
    };
  }
}

class CompanyProfileModel {
  final String id;
  final String userId;
  final String name;
  final String? website;
  final String? industry;
  final String? size;
  final String? description;
  final String? logoUrl;
  final String? location;

  CompanyProfileModel({
    required this.id,
    required this.userId,
    required this.name,
    this.website,
    this.industry,
    this.size,
    this.description,
    this.logoUrl,
    this.location,
  });

  factory CompanyProfileModel.fromJson(Map<String, dynamic> json) {
    return CompanyProfileModel(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      website: json['website'] as String?,
      industry: json['industry'] as String?,
      size: json['size'] as String?,
      description: json['description'] as String?,
      logoUrl: json['logoUrl'] as String?,
      location: json['location'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'website': website,
      'industry': industry,
      'size': size,
      'description': description,
      'logoUrl': logoUrl,
      'location': location,
    };
  }
}

class MeResponseModel {
  final UserModel user;
  final CandidateProfileModel? candidateProfile;
  final CompanyProfileModel? companyProfile;
  final bool hasProfile;

  MeResponseModel({
    required this.user,
    this.candidateProfile,
    this.companyProfile,
    required this.hasProfile,
  });

  factory MeResponseModel.fromJson(Map<String, dynamic> json) {
    return MeResponseModel(
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      candidateProfile: json['candidateProfile'] != null
          ? CandidateProfileModel.fromJson(
              json['candidateProfile'] as Map<String, dynamic>)
          : null,
      companyProfile: json['companyProfile'] != null
          ? CompanyProfileModel.fromJson(
              json['companyProfile'] as Map<String, dynamic>)
          : null,
      hasProfile: json['hasProfile'] as bool? ?? false,
    );
  }
}
