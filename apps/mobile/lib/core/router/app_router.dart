import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/role_picker_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/dashboard/screens/home_dashboard_screen.dart';

CustomTransitionPage<T> buildPageWithSlideFadeTransition<T>({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final slideAnimation = Tween<Offset>(
        begin: const Offset(0.05, 0.0),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
      );

      final fadeAnimation = CurvedAnimation(
        parent: animation,
        curve: Curves.easeIn,
      );

      return SlideTransition(
        position: slideAnimation,
        child: FadeTransition(
          opacity: fadeAnimation,
          child: child,
        ),
      );
    },
  );
}

final GoRouter appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      pageBuilder: (context, state) => buildPageWithSlideFadeTransition(
        context: context,
        state: state,
        child: const SplashScreen(),
      ),
    ),
    GoRoute(
      path: '/role-picker',
      pageBuilder: (context, state) => buildPageWithSlideFadeTransition(
        context: context,
        state: state,
        child: const RolePickerScreen(),
      ),
    ),
    GoRoute(
      path: '/register',
      pageBuilder: (context, state) {
        final role = state.uri.queryParameters['role'];
        return buildPageWithSlideFadeTransition(
          context: context,
          state: state,
          child: RegisterScreen(initialRole: role),
        );
      },
    ),
    GoRoute(
      path: '/login',
      pageBuilder: (context, state) => buildPageWithSlideFadeTransition(
        context: context,
        state: state,
        child: const LoginScreen(),
      ),
    ),
    GoRoute(
      path: '/onboarding',
      pageBuilder: (context, state) => buildPageWithSlideFadeTransition(
        context: context,
        state: state,
        child: const OnboardingScreen(),
      ),
    ),
    GoRoute(
      path: '/dashboard',
      pageBuilder: (context, state) => buildPageWithSlideFadeTransition(
        context: context,
        state: state,
        child: const HomeDashboardScreen(),
      ),
    ),
  ],
);
