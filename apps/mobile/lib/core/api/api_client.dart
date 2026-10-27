import 'package:dio/dio.dart';
import '../auth/token_storage_service.dart';

class ApiClient {
  static String get defaultBaseUrl {
    const fromEnv = String.fromEnvironment('API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    // On physical iPhone and Android devices, connect directly to the Mac host API on the local network.
    return 'http://192.168.29.115:5001/api';
  }

  final Dio dio;
  final TokenStorageService tokenStorage;
  bool _isRefreshing = false;

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
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
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

          if (error.response?.statusCode == 401 && !isAuthEndpoint) {
            if (!_isRefreshing) {
              _isRefreshing = true;

              try {
                final refreshToken = await tokenStorage.getRefreshToken();
                if (refreshToken == null || refreshToken.isEmpty) {
                  await tokenStorage.clearAll();
                  return handler.reject(error);
                }

                // Call refresh endpoint with a clean Dio instance
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

                  // Update header and retry original request
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

          if ((error.type == DioExceptionType.connectionError ||
                  error.type == DioExceptionType.connectionTimeout) &&
              requestOptions.extra['retried_fallback'] != true) {
            requestOptions.extra['retried_fallback'] = true;
            final currentBase = dio.options.baseUrl;
            final fallbackBase = currentBase.contains('192.168.29.115')
                ? 'http://127.0.0.1:5001/api'
                : 'http://192.168.29.115:5001/api';

            dio.options.baseUrl = fallbackBase;
            requestOptions.baseUrl = fallbackBase;
            try {
              final response = await dio.fetch(requestOptions);
              return handler.resolve(response);
            } catch (_) {
              // Revert base URL if fallback also fails
              dio.options.baseUrl = currentBase;
            }
          }

          return handler.next(error);
        },
      ),
    );
  }
}
