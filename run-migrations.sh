#!/bin/bash
# ZarcFit SQL Migration Helper
# Full ordered list: MIGRATION_RUNBOOK.md

set -e

MIGRATIONS=(
  "schema.sql"
  "fix-auth-trigger.sql"
  "trainer-platform-schema.sql"
  "update-rls-policies.sql"
  "workout-nutrition-rls.sql"
  "storage-schema.sql"
  "admin-schema.sql"
  "blog-schema.sql"
  "contact-schema.sql"
  "meal-diary.sql"
  "health-import.sql"
  "session-requests.sql"
  "client-search.sql"
  "invitation-flow.sql"
  "invite-only-clients.sql"
  "ensure-signup-role.sql"
  "default-client-role.sql"
  "prevent-trainer-as-client.sql"
  "backfill-client-trainers.sql"
  "fix-trainer-client-queries.sql"
  "trainer-plan-templates.sql"
  "exercise-log-difficulty.sql"
  "exercise-library-seed.sql"
  "messaging-access.sql"
  "notifications.sql"
  "trainer-activity.sql"
  "sleep-unique-constraint.sql"
  "blog-slug.sql"
  "message-read-receipts.sql"
  "user-preferences.sql"
  "meal-favorites.sql"
  "stripe-subscriptions.sql"
)

if [[ "$1" == "--list" ]]; then
  echo "ZarcFit SQL migrations (run in order via Supabase SQL Editor):"
  echo "See MIGRATION_RUNBOOK.md for details."
  echo ""
  i=1
  for f in "${MIGRATIONS[@]}"; do
    echo "  $i. src/lib/supabase/$f"
    ((i++))
  done
  exit 0
fi

echo "⚠️  Automated psql migration of all ${#MIGRATIONS[@]} files is not yet supported."
echo ""
echo "Recommended: open MIGRATION_RUNBOOK.md and run each file in Supabase SQL Editor."
echo ""
echo "To list all files: ./run-migrations.sh --list"
exit 1
