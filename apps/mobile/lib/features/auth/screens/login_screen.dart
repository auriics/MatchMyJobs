import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/social_sign_in_buttons.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      final success = await ref
          .read(authStateProvider.notifier)
          .login(email, password);

      if (success && mounted) {
        final authState = ref.read(authStateProvider);
        if (authState.hasProfile) {
          context.go('/dashboard');
        } else {
          context.go('/onboarding');
        }
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    final ok = await ref.read(authStateProvider.notifier).signInWithGoogle();
    if (!mounted) return;
    if (ok) {
      final updated = ref.read(authStateProvider);
      if (updated.hasProfile) {
        context.go('/dashboard');
      } else {
        context.go('/onboarding');
      }
    }
  }

  Future<void> _handleLinkedInSignIn() async {
    final ok = await ref.read(authStateProvider.notifier).signInWithLinkedIn();
    if (!mounted) return;
    if (ok) {
      final updated = ref.read(authStateProvider);
      if (updated.hasProfile) {
        context.go('/dashboard');
      } else {
        context.go('/onboarding');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isLoading = authState.status == AuthStatus.loading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Welcome Back',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Sign in to access your matched opportunities',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),

              // Social Sign In
              SocialSignInButtons(
                isLoading: isLoading,
                onGooglePressed: _handleGoogleSignIn,
                onLinkedInPressed: _handleLinkedInSignIn,
              ),

              const SizedBox(height: 20),
              Row(
                children: [
                  const Expanded(child: Divider(color: AppColors.borderSubtle)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'OR EMAIL SIGN IN',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: AppColors.borderSubtle)),
                ],
              ),
              const SizedBox(height: 20),

              if (authState.errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          authState.errorMessage!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppTextField(
                      label: 'Email Address',
                      hintText: 'name@example.com',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: const Icon(Icons.mail_outline),
                      validator: FormBuilderValidators.compose([
                        FormBuilderValidators.required(errorText: 'Email is required'),
                        FormBuilderValidators.email(errorText: 'Enter a valid email'),
                      ]),
                    ),
                    const SizedBox(height: 16),

                    AppTextField(
                      label: 'Password',
                      hintText: 'Enter your password',
                      controller: _passwordController,
                      isPassword: true,
                      prefixIcon: const Icon(Icons.lock_outline),
                      validator: FormBuilderValidators.required(
                          errorText: 'Password is required'),
                    ),
                    const SizedBox(height: 24),

                    AppButton(
                      text: 'Sign In',
                      isLoading: isLoading,
                      onPressed: _submit,
                      rightIcon: const Icon(
                        Icons.arrow_forward_rounded,
                        color: AppColors.textPrimary,
                        size: 18,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              Center(
                child: TextButton(
                  onPressed: () => context.push('/role-picker'),
                  child: const Text.rich(
                    TextSpan(
                      text: "Don't have an account? ",
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      children: [
                        TextSpan(
                          text: 'Create Account',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
