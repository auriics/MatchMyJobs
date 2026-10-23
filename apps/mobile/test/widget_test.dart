import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App smoke test builds successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MatchMyJobsApp(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 2500));
    await tester.pumpAndSettle();

    expect(find.byType(MatchMyJobsApp), findsOneWidget);
  });
}
