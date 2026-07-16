# Notification Deep Link Audit (ZF-204)

Verified July 16, 2026 against `notifications.sql` triggers and app routes.

| Notification type | link_path | Route exists | Notes |
|-------------------|-----------|--------------|-------|
| workout_assigned | `/client/workout` | ✅ | |
| meal_plan_created | `/client/meal-plan` | ✅ | |
| message (client) | `/client/chat` | ✅ | |
| message (trainer) | `/trainer/messages?client={id}` | ✅ | Query param handled in messages page |
| workout_logged | `/trainer/clients/{user_id}` | ✅ | |
| progress_logged | `/trainer/clients/{user_id}` | ✅ | |
| goal_updated | `/trainer/clients/{user_id}` | ✅ | |
| sleep_logged | `/trainer/clients/{user_id}` | ✅ | |
| session approved/declined | `/client/calendar` | ✅ | Added in session-request-notifications.sql |

**Action:** Ensure `session-request-notifications.sql` is applied in production.
