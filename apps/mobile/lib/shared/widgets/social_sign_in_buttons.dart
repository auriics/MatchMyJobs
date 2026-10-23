import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class SocialSignInButtons extends StatelessWidget {
  final VoidCallback onGooglePressed;
  final VoidCallback onLinkedInPressed;
  final bool isLoading;

  const SocialSignInButtons({
    super.key,
    required this.onGooglePressed,
    required this.onLinkedInPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Google Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed: isLoading ? null : onGooglePressed,
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              side: const BorderSide(color: AppColors.borderSubtle),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.network(
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png',
                  width: 18,
                  height: 18,
                  errorBuilder: (context, error, stackTrace) => const Icon(
                    Icons.g_mobiledata,
                    size: 24,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Continue with Google',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // LinkedIn Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            onPressed: isLoading ? null : onLinkedInPressed,
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              side: BorderSide(color: const Color(0xFF0A66C2).withValues(alpha: 0.3)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.business_center,
                  size: 18,
                  color: Color(0xFF0A66C2),
                ),
                SizedBox(width: 12),
                Text(
                  'Continue with LinkedIn',
                  style: TextStyle(
                    color: Color(0xFF0A66C2),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
