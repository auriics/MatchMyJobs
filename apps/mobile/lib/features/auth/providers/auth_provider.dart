import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_service.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/profile_models.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final CandidateProfileModel? candidateProfile;
  final CompanyProfileModel? companyProfile;
  final bool hasProfile;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.candidateProfile,
    this.companyProfile,
    this.hasProfile = false,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    CandidateProfileModel? candidateProfile,
    CompanyProfileModel? companyProfile,
    bool? hasProfile,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      candidateProfile: candidateProfile ?? this.candidateProfile,
      companyProfile: companyProfile ?? this.companyProfile,
      hasProfile: hasProfile ?? this.hasProfile,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.read(authServiceProvider);
    checkAuthStatus();
    return const AuthState(status: AuthStatus.initial);
  }

  Future<void> checkAuthStatus() async {
    final token = await _authService.storage.getAccessToken();
    if (token == null) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }

    try {
      final me = await _authService.getMe();
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: me.user,
        candidateProfile: me.candidateProfile,
        companyProfile: me.companyProfile,
        hasProfile: me.hasProfile,
      );
    } catch (_) {
      await _authService.storage.clearAll();
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _authService.login(email: email, password: password);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        hasProfile: response.hasProfile,
      );
      await checkAuthStatus();
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required UserRole role,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _authService.register(
        email: email,
        password: password,
        role: role,
      );
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        hasProfile: response.hasProfile,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> signInWithGoogle([UserRole? role]) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _authService.signInWithGoogle(role: role);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        hasProfile: response.hasProfile,
      );
      await checkAuthStatus();
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> signInWithLinkedIn([UserRole? role]) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final response = await _authService.signInWithLinkedIn(role: role);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: response.user,
        hasProfile: response.hasProfile,
      );
      await checkAuthStatus();
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> saveCandidateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final profile = await _authService.createCandidateProfile(data);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        candidateProfile: profile,
        hasProfile: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<bool> saveCompanyProfile(Map<String, dynamic> data) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final profile = await _authService.createCompanyProfile(data);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        companyProfile: profile,
        hasProfile: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void clearError() => state = state.copyWith(errorMessage: null);
}

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authStateProvider =
    NotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
