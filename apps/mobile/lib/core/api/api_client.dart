import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../auth/token_storage_service.dart';

class ApiClient {
  static const String envApiUrl = String.fromEnvironment('API_URL');
  static const String localWifiUrl = 'http://192.168.29.115:5001/api';
  static const String androidEmulatorUrl = 'http://10.0.2.2:5001/api';
  static const String localhostUrl = 'http://127.0.0.1:5001/api';

  static String get defaultBaseUrl {
    if (envApiUrl.isNotEmpty) return envApiUrl;
    // Default to Mac local Wi-Fi IP for physical iOS & Android testing
    return localWifiUrl;
  }

  final Dio dio;
  final TokenStorageService tokenStorage;
  bool _isRefreshing = false;
  bool _hasLoadedCustomUrl = false;

  ApiClient({
    String? baseUrl,
    TokenStorageService? storage,
  })  : tokenStorage = storage ?? TokenStorageService(),
        dio = Dio(
          BaseOptions(
            baseUrl: baseUrl ?? defaultBaseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          ),
        ) {
    _initCustomBaseUrl();
    _setupInterceptors();
  }

  Future<void> _initCustomBaseUrl() async {
    try {
      final custom = await tokenStorage.getCustomBaseUrl();
      if (custom != null && custom.trim().isNotEmpty) {
        updateBaseUrl(custom.trim());
      }
    } catch (_) {}
    _hasLoadedCustomUrl = true;
  }

  void updateBaseUrl(String newUrl) {
    var url = newUrl.trim();
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (!url.endsWith('/api')) {
      url = '$url/api';
    }
    dio.options.baseUrl = url;
  }

  Future<void> saveAndApplyBaseUrl(String newUrl) async {
    updateBaseUrl(newUrl);
    await tokenStorage.saveCustomBaseUrl(dio.options.baseUrl);
  }

  Future<Map<String, dynamic>?> checkHealth([String? testUrl]) async {
    final baseUrl = testUrl != null && testUrl.trim().isNotEmpty
        ? testUrl.trim()
        : dio.options.baseUrl;

    var target = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    if (!target.endsWith('/api')) {
      target = '$target/api';
    }
    final healthUrl = '$target/health';

    try {
      final testDio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 4),
          receiveTimeout: const Duration(seconds: 4),
          headers: {'ngrok-skip-browser-warning': 'true'},
        ),
      );
      final response = await testDio.get(healthUrl);
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        return response.data as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!_hasLoadedCustomUrl) {
            await _initCustomBaseUrl();
            options.baseUrl = dio.options.baseUrl;
          }

          final token = await tokenStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final requestOptions = error.requestOptions;

          final isAuthEndpoint = requestOptions.path.contains('/auth/login') ||
              requestOptions.path.contains('/auth/register') ||
              requestOptions.path.contains('/auth/refresh');

          // Handle 401 Unauthorized by attempting JWT token refresh
          if (error.response?.statusCode == 401 && !isAuthEndpoint) {
            if (!_isRefreshing) {
              _isRefreshing = true;

              try {
                final refreshToken = await tokenStorage.getRefreshToken();
                if (refreshToken == null || refreshToken.isEmpty) {
                  await tokenStorage.clearAll();
                  return handler.reject(error);
                }

                final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
                final response = await refreshDio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                if (response.statusCode == 200) {
                  final data = response.data['data'] as Map<String, dynamic>;
                  final newAccessToken = data['accessToken'] as String;
                  final newRefreshToken = data['refreshToken'] as String?;

                  await tokenStorage.saveTokens(
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken ?? refreshToken,
                  );

                  requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  final retryResponse = await dio.fetch(requestOptions);
                  _isRefreshing = false;
                  return handler.resolve(retryResponse);
                }
              } catch (refreshError) {
                await tokenStorage.clearAll();
                _isRefreshing = false;
                return handler.reject(error);
              } finally {
                _isRefreshing = false;
              }
            }
          }

          // Smart auto-fallback across Android emulator, iOS simulator, and Wi-Fi host
          if ((error.type == DioExceptionType.connectionError ||
                  error.type == DioExceptionType.connectionTimeout) &&
              requestOptions.extra['retried_fallback'] != true) {
            requestOptions.extra['retried_fallback'] = true;
            final currentBase = dio.options.baseUrl;

            final List<String> candidateUrls = [];
            if (defaultTargetPlatform == TargetPlatform.android) {
              candidateUrls.addAll([androidEmulatorUrl, localWifiUrl, localhostUrl]);
            } else if (defaultTargetPlatform == TargetPlatform.iOS) {
              candidateUrls.addAll([localhostUrl, localWifiUrl]);
            } else {
              candidateUrls.addAll([localhostUrl, localWifiUrl]);
            }

            final fallbackTargets = candidateUrls.where((u) => u != currentBase).toList();

            for (final candidate in fallbackTargets) {
              try {
                final probeDio = Dio(
                  BaseOptions(
                    connectTimeout: const Duration(seconds: 2),
                    receiveTimeout: const Duration(seconds: 2),
                    headers: {'ngrok-skip-browser-warning': 'true'},
                  ),
                );
                final check = await probeDio.get('$candidate/health');
                if (check.statusCode == 200) {
                  dio.options.baseUrl = candidate;
                  requestOptions.baseUrl = candidate;
                  await tokenStorage.saveCustomBaseUrl(candidate);
                  final response = await dio.fetch(requestOptions);
                  return handler.resolve(response);
                }
              } catch (_) {
                // Continue trying next candidate
              }
            }

            // Restore if all candidates failed
            dio.options.baseUrl = currentBase;
          }

          return handler.next(error);
        },
      ),
    );
  }
}
