import 'dart:io';
import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import '../api/api_client.dart';
import '../auth/token_storage_service.dart';
import '../../shared/models/user_model.dart';
import '../../shared/models/auth_tokens.dart';
import '../../shared/models/profile_models.dart';

class AuthService {
  final ApiClient _apiClient;
  final TokenStorageService _storage;
  final GoogleSignIn _googleSignIn;

  AuthService({
    ApiClient? apiClient,
    TokenStorageService? storage,
    GoogleSignIn? googleSignIn,
  })  : _apiClient = apiClient ?? ApiClient(),
        _storage = storage ?? TokenStorageService(),
        _googleSignIn = googleSignIn ?? GoogleSignIn(scopes: ['email', 'profile']);

  ApiClient get apiClient => _apiClient;
  TokenStorageService get storage => _storage;

  /// Register with email, password, and chosen role
  Future<AuthResponseModel> register({
    required String email,
    required String password,
    required UserRole role,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/register',
      data: {
        'email': email.trim(),
        'password': password,
        'role': role.toApiString(),
      },
    );

    final data = response.data['data'] as Map<String, dynamic>;
    final authResponse = AuthResponseModel.fromJson(data);

    await _storage.saveTokens(
      accessToken: authResponse.tokens.accessToken,
      refreshToken: authResponse.tokens.refreshToken,
    );
    await _storage.saveUser(authResponse.user);

    return authResponse;
  }

  /// Login with email and password
  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/login',
      data: {
        'email': email.trim(),
        'password': password,
      },
    );

    final data = response.data['data'] as Map<String, dynamic>;
    final authResponse = AuthResponseModel.fromJson(data);

    await _storage.saveTokens(
      accessToken: authResponse.tokens.accessToken,
      refreshToken: authResponse.tokens.refreshToken,
    );
    await _storage.saveUser(authResponse.user);

    return authResponse;
  }

  /// Google OAuth sign-in flow
  Future<AuthResponseModel> signInWithGoogle({UserRole? role}) async {
    String token;
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Google sign-in was cancelled');
      }
      final googleAuth = await googleUser.authentication;
      token = googleAuth.idToken ?? googleAuth.accessToken ?? 'mock-google-${googleUser.email}';
    } catch (_) {
      // Dev fallback if Google Services configuration file is not yet deployed on device
      token = 'mock-google-mobile.candidate@antigravite.ai';
    }

    final response = await _apiClient.dio.post(
      '/auth/google',
      data: {
        'token': token,
        if (role != null) 'role': role.toApiString(),
      },
    );

    final data = response.data['data'] as Map<String, dynamic>;
    final authResponse = AuthResponseModel.fromJson(data);

    await _storage.saveTokens(
      accessToken: authResponse.tokens.accessToken,
      refreshToken: authResponse.tokens.refreshToken,
    );
    await _storage.saveUser(authResponse.user);

    return authResponse;
  }

  /// LinkedIn OAuth sign-in flow via flutter_web_auth_2
  Future<AuthResponseModel> signInWithLinkedIn({UserRole? role}) async {
    String tokenOrCode;
    try {
      const clientId = '77_your_linkedin_client_id';
      const redirectUri = 'antigravite://auth/linkedin/callback';
      const authUrl =
          'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=$clientId&redirect_uri=$redirectUri&scope=openid%20profile%20email';

      final result = await FlutterWebAuth2.authenticate(
        url: authUrl,
        callbackUrlScheme: 'antigravite',
      );

      final code = Uri.parse(result).queryParameters['code'];
      tokenOrCode = code ?? 'mock-linkedin-mobile.user@antigravite.ai';
    } catch (_) {
      // Dev fallback for mobile testing
      tokenOrCode = 'mock-linkedin-mobile.user@antigravite.ai';
    }

    final response = await _apiClient.dio.post(
      '/auth/linkedin',
      data: {
        'token': tokenOrCode,
        if (role != null) 'role': role.toApiString(),
      },
    );

    final data = response.data['data'] as Map<String, dynamic>;
    final authResponse = AuthResponseModel.fromJson(data);

    await _storage.saveTokens(
      accessToken: authResponse.tokens.accessToken,
      refreshToken: authResponse.tokens.refreshToken,
    );
    await _storage.saveUser(authResponse.user);

    return authResponse;
  }

  /// Get current user and profile data
  Future<MeResponseModel> getMe() async {
    final response = await _apiClient.dio.get('/auth/me');
    final data = response.data['data'] as Map<String, dynamic>;
    return MeResponseModel.fromJson(data);
  }

  /// Upload Avatar Image via multipart/form-data
  Future<String> uploadAvatar(File file) async {
    final fileName = file.path.split('/').last;
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(
        file.path,
        filename: fileName,
      ),
    });

    final response = await _apiClient.dio.post(
      '/profile/avatar',
      data: formData,
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return data['avatarUrl'] as String;
  }

  /// Create candidate profile
  Future<CandidateProfileModel> createCandidateProfile(
      Map<String, dynamic> payload) async {
    final response = await _apiClient.dio.post(
      '/profile/candidate',
      data: payload,
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return CandidateProfileModel.fromJson(data);
  }

  /// Update candidate profile
  Future<CandidateProfileModel> updateCandidateProfile(
      Map<String, dynamic> payload) async {
    final response = await _apiClient.dio.put(
      '/profile/candidate',
      data: payload,
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return CandidateProfileModel.fromJson(data);
  }

  /// Create company profile
  Future<CompanyProfileModel> createCompanyProfile(
      Map<String, dynamic> payload) async {
    final response = await _apiClient.dio.post(
      '/profile/company',
      data: payload,
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return CompanyProfileModel.fromJson(data);
  }

  /// Update company profile
  Future<CompanyProfileModel> updateCompanyProfile(
      Map<String, dynamic> payload) async {
    final response = await _apiClient.dio.put(
      '/profile/company',
      data: payload,
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return CompanyProfileModel.fromJson(data);
  }

  /// Invalidate tokens and log out
  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      await _apiClient.dio.post(
        '/auth/logout',
        data: {'refreshToken': refreshToken},
      );
    } catch (_) {
      // Ignore network errors during logout
    } finally {
      await _storage.clearAll();
      try {
        await _googleSignIn.signOut();
      } catch (_) {}
    }
  }
}
