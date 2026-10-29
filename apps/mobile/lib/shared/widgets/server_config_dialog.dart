import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/app_colors.dart';

class ServerConfigDialog extends StatefulWidget {
  final ApiClient apiClient;

  const ServerConfigDialog({
    super.key,
    required this.apiClient,
  });

  static Future<void> show(BuildContext context, ApiClient apiClient) {
    return showDialog(
      context: context,
      builder: (ctx) => ServerConfigDialog(apiClient: apiClient),
    );
  }

  @override
  State<ServerConfigDialog> createState() => _ServerConfigDialogState();
}

class _ServerConfigDialogState extends State<ServerConfigDialog> {
  late final TextEditingController _urlController;
  String? _statusMessage;
  bool _isChecking = false;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: widget.apiClient.dio.options.baseUrl);
    _testConnection(quiet: true);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection({bool quiet = false}) async {
    setState(() {
      _isChecking = true;
      if (!quiet) _statusMessage = 'Testing connection...';
      _isSuccess = false;
    });

    final health = await widget.apiClient.checkHealth(_urlController.text.trim());

    if (!mounted) return;
    setState(() {
      _isChecking = false;
      if (health != null && health['status'] == 'ok') {
        _isSuccess = true;
        _statusMessage = 'Connected: ${health['service'] ?? 'REST API'} (Supabase Live)';
      } else {
        _isSuccess = false;
        _statusMessage = 'Connection failed. Verify API is running and reachable.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.dns_rounded, color: AppColors.primary),
          SizedBox(width: 10),
          Text(
            'Server Configuration',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configure the backend endpoint for iOS & Android testing:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _urlController,
              decoration: InputDecoration(
                labelText: 'API Base URL',
                hintText: 'http://192.168.29.115:5001/api',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 14),
            const Text(
              'Quick Presets:',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('Wi-Fi Mac (192.168.29.115)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    setState(() {
                      _urlController.text = 'http://192.168.29.115:5001/api';
                    });
                    _testConnection();
                  },
                ),
                ActionChip(
                  label: const Text('Android Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    setState(() {
                      _urlController.text = 'http://10.0.2.2:5001/api';
                    });
                    _testConnection();
                  },
                ),
                ActionChip(
                  label: const Text('iOS Simulator (127.0.0.1)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    setState(() {
                      _urlController.text = 'http://127.0.0.1:5001/api';
                    });
                    _testConnection();
                  },
                ),
              ],
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: _isSuccess ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _isSuccess ? const Color(0xFF4CAF50) : const Color(0xFFE57373),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isSuccess ? Icons.check_circle_rounded : Icons.error_outline_rounded,
                      size: 16,
                      color: _isSuccess ? Colors.green.shade700 : Colors.red.shade700,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _statusMessage!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: _isSuccess ? Colors.green.shade900 : Colors.red.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isChecking ? null : () => _testConnection(),
          child: _isChecking
              ? const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Test Connection'),
        ),
        ElevatedButton(
          onPressed: () async {
            final navigator = Navigator.of(context);
            final scaffoldMessenger = ScaffoldMessenger.of(context);
            final newUrl = _urlController.text.trim();
            await widget.apiClient.saveAndApplyBaseUrl(newUrl);
            if (!mounted) return;
            navigator.pop();
            scaffoldMessenger.showSnackBar(
              SnackBar(
                content: Text('Server endpoint applied: ${widget.apiClient.dio.options.baseUrl}'),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
          child: const Text('Save & Apply'),
        ),
      ],
    );
  }
}
