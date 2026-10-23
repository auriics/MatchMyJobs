import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum AppButtonVariant { primary, secondary, outline }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final Widget? leftIcon;
  final Widget? rightIcon;
  final double? width;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.leftIcon,
    this.rightIcon,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final isPrimary = variant == AppButtonVariant.primary;
    final isSecondary = variant == AppButtonVariant.secondary;

    final bgColor = isPrimary
        ? AppColors.primary
        : isSecondary
            ? AppColors.tint3
            : Colors.transparent;

    final fgColor = AppColors.textPrimary;
    final border = variant == AppButtonVariant.outline
        ? Border.all(color: AppColors.primary, width: 2)
        : isSecondary
            ? Border.all(color: AppColors.accent, width: 1)
            : null;

    return SizedBox(
      width: width ?? double.infinity,
      height: 52,
      child: Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(16),
          splashColor: AppColors.tint1.withValues(alpha: 0.5),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: border,
              boxShadow: isPrimary
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Center(
              child: isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(AppColors.textPrimary),
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (leftIcon != null) ...[
                          leftIcon!,
                          const SizedBox(width: 8),
                        ],
                        Text(
                          text,
                          style: TextStyle(
                            color: fgColor,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (rightIcon != null) ...[
                          const SizedBox(width: 8),
                          rightIcon!,
                        ],
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
