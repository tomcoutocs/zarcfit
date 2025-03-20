# Supabase Database Architecture for ZarcFit Dashboard

This directory contains the database schema and TypeScript API functions for interacting with the Supabase backend to store and retrieve user dashboard data.

## Database Tables

We've designed the following tables to store user data:

1. `user_profiles` - Extends the default Supabase auth.users table with additional profile information
2. `calendar_events` - Stores user calendar events (workouts, coaching sessions, etc.)
3. `workout_programs` - Training programs created for or by users
4. `workout_sessions` - Individual workout sessions within a program
5. `exercises` - Exercise database with descriptions and metadata
6. `workout_exercises` - Junction table linking exercises to workout sessions
7. `workout_logs` - Records of completed workouts
8. `exercise_logs` - Details of exercises performed during workouts
9. `nutrition_plans` - Nutrition plans for users
10. `meal_plans` - Daily meal plans within a nutrition plan
11. `meals` - Individual meals within a meal plan
12. `progress_tracking` - User physical measurements and progress photos
13. `goals` - User fitness and health goals

## Setting Up Supabase

### 1. Create Database Tables

Log into your Supabase dashboard and navigate to the SQL Editor. Copy and paste the contents of `schema.sql` into a new query and run it to create all the necessary tables with proper relationships and security policies.

### 2. Integrate API Functions

The `dashboard-api.ts` file contains TypeScript functions for interacting with these tables. Import these functions in your components to:

- Fetch user profile data
- Create, read, update, and delete workout programs
- Track user progress
- Manage nutrition plans
- Set and monitor goals
- Log completed workouts

## Using the API Functions

### Example: Fetching User Profile

```typescript
import { userProfilesApi } from '@/lib/supabase/dashboard-api';
import { useAuth } from '@/context/auth-context';

export function ProfileComponent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const profileData = await userProfilesApi.getProfile(user.id);
        setProfile(profileData);
      }
    }
    
    loadProfile();
  }, [user]);
  
  // Render profile data...
}
```

### Example: Creating a Workout Program

```typescript
import { workoutProgramsApi } from '@/lib/supabase/dashboard-api';
import { useAuth } from '@/context/auth-context';

export function WorkoutProgramForm() {
  const { user } = useAuth();
  
  const handleSubmit = async (formData) => {
    if (user) {
      const newProgram = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        difficulty: formData.difficulty,
        duration_weeks: formData.duration,
        // ... other fields
      };
      
      const created = await workoutProgramsApi.createProgram(newProgram);
      if (created) {
        // Handle success
      }
    }
  };
  
  // Form rendering...
}
```

## Row Level Security (RLS)

The database is configured with Row Level Security to ensure users can only access their own data. The security policies are defined in the schema.sql file and are automatically applied when the tables are created.

## Extending the Schema

If you need to add new tables or modify the existing schema:

1. Update the `schema.sql` file with your changes
2. Execute the new SQL in the Supabase SQL Editor
3. Add corresponding TypeScript types and API functions in `dashboard-api.ts`

## Troubleshooting

If you encounter errors when interacting with the database:

1. Check the console logs for detailed error messages
2. Verify that the current user has the appropriate permissions
3. Ensure all required fields are provided when creating or updating records
4. Check that Row Level Security policies are not blocking legitimate access 