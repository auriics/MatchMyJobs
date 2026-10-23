import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/social_sign_in_buttons.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final String? initialRole;

  const RegisterScreen({super.key, this.initialRole});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  late UserRole _role;

  @override
  void initState() {
    super.initState();
    _role = UserRole.fromString(widget.initialRole);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      final success = await ref.read(authStateProvider.notifier).register(
            email: email,
            password: password,
            role: _role,
          );

      if (success && mounted) {
        context.go('/onboarding');
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    final ok = await ref.read(authStateProvider.notifier).signInWithGoogle(_role);
    if (!mounted) return;
    if (ok) {
      final updatedAuth = ref.read(authStateProvider);
      if (updatedAuth.hasProfile) {
        context.go('/dashboard');
      } else {
        context.go('/onboarding');
      }
    }
  }

  Future<void> _handleLinkedInSignIn() async {
    final ok = await ref.read(authStateProvider.notifier).signInWithLinkedIn(_role);
    if (!mounted) return;
    if (ok) {
      final updatedAuth = ref.read(authStateProvider);
      if (updatedAuth.hasProfile) {
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
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.tint3,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary),
                    ),
                    child: Text(
                      _role.name,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () => context.pop(),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                    ),
                    child: const Text(
                      'Change',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryDeep,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Join Match My Jobs',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'AI-powered job and talent matching starts here',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // Social Sign-In
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
                      'OR SIGN UP WITH EMAIL',
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

              // Form
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
                        FormBuilderValidators.email(errorText: 'Enter a valid email address'),
                      ]),
                    ),
                    const SizedBox(height: 16),

                    AppTextField(
                      label: 'Password',
                      hintText: 'At least 8 characters',
                      controller: _passwordController,
                      isPassword: true,
                      prefixIcon: const Icon(Icons.lock_outline),
                      validator: FormBuilderValidators.compose([
                        FormBuilderValidators.required(errorText: 'Password is required'),
                        FormBuilderValidators.minLength(8, errorText: 'Minimum 8 characters'),
                      ]),
                    ),
                    const SizedBox(height: 16),

                    AppTextField(
                      label: 'Confirm Password',
                      hintText: 'Re-enter your password',
                      controller: _confirmPasswordController,
                      isPassword: true,
                      prefixIcon: const Icon(Icons.lock_outline),
                      validator: (val) {
                        if (val == null || val.isEmpty) {
                          return 'Please confirm password';
                        }
                        if (val != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    AppButton(
                      text: 'Create Account',
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

              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () => context.push('/login'),
                  child: const Text.rich(
                    TextSpan(
                      text: 'Already have an account? ',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      children: [
                        TextSpan(
                          text: 'Sign In',
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
