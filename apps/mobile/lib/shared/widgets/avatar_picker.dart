import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/auth/auth_service.dart';

class AvatarPicker extends StatefulWidget {
  final String? initialUrl;
  final ValueChanged<String> onUploaded;
  final String label;

  const AvatarPicker({
    super.key,
    this.initialUrl,
    required this.onUploaded,
    this.label = 'Upload Profile Avatar',
  });

  @override
  State<AvatarPicker> createState() => _AvatarPickerState();
}

class _AvatarPickerState extends State<AvatarPicker> {
  final ImagePicker _picker = ImagePicker();
  final AuthService _authService = AuthService();
  File? _localImageFile;
  String? _uploadedUrl;
  bool _isUploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.initialUrl;
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      final file = File(pickedFile.path);
      setState(() {
        _localImageFile = file;
        _isUploading = true;
        _error = null;
      });

      final url = await _authService.uploadAvatar(file);

      setState(() {
        _uploadedUrl = url;
        _isUploading = false;
      });

      widget.onUploaded(url);
    } catch (e) {
      setState(() {
        _isUploading = false;
        _error = 'Failed to upload photo';
      });
    }
  }

  void _showSourceModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.tint3,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.camera_alt, color: AppColors.primaryDeep),
                ),
                title: const Text('Take a Photo', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.tint3,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.photo_library, color: AppColors.primaryDeep),
                ),
                title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: _isUploading ? null : _showSourceModal,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.tint3,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppColors.primary, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(25),
                  child: _localImageFile != null
                      ? Image.file(_localImageFile!, fit: BoxFit.cover)
                      : (_uploadedUrl != null && _uploadedUrl!.isNotEmpty)
                          ? CachedNetworkImage(
                              imageUrl: _uploadedUrl!,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                              errorWidget: (context, url, error) => const Icon(
                                Icons.person,
                                size: 48,
                                color: AppColors.primaryDeep,
                              ),
                            )
                          : const Center(
                              child: Icon(
                                Icons.person_add_alt_1_outlined,
                                size: 40,
                                color: AppColors.primaryDeep,
                              ),
                            ),
                ),
              ),

              // Uploading spinner
              if (_isUploading)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.textPrimary.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation(AppColors.primary),
                      ),
                    ),
                  ),
                ),

              // Camera icon badge
              Positioned(
                bottom: -4,
                right: -4,
                child: Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.accent, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.camera_alt,
                    size: 16,
                    color: AppColors.primaryDeep,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          widget.label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 4),
          Text(
            _error!,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.error,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }
}
