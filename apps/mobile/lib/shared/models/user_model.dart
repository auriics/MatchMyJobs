// ignore_for_file: constant_identifier_names

enum UserRole {
  CANDIDATE,
  COMPANY_OWNER,
  RECRUITER,
  HIRING_MANAGER,
  ADS_MANAGER,
  PLATFORM_ADMIN;

  static UserRole fromString(String? role) {
    switch (role?.toUpperCase()) {
      case 'CANDIDATE':
        return UserRole.CANDIDATE;
      case 'COMPANY_OWNER':
        return UserRole.COMPANY_OWNER;
      case 'RECRUITER':
        return UserRole.RECRUITER;
      case 'HIRING_MANAGER':
        return UserRole.HIRING_MANAGER;
      case 'ADS_MANAGER':
        return UserRole.ADS_MANAGER;
      case 'PLATFORM_ADMIN':
        return UserRole.PLATFORM_ADMIN;
      default:
        return UserRole.CANDIDATE;
    }
  }

  String toApiString() {
    return name;
  }
}

class UserModel {
  final String id;
  final String email;
  final UserRole role;
  final bool isEmailVerified;
  final String createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.role,
    required this.isEmailVerified,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: UserRole.fromString(json['role'] as String?),
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role.toApiString(),
      'isEmailVerified': isEmailVerified,
      'createdAt': createdAt,
    };
  }
}
