# ZarcoFit Implementation Checklist

Use this checklist to track your progress as you implement features.

---

## 🎯 Quick Wins (Start Here)

### Profile Page Fix (1-2 hours)
- [ ] Update `handleSubmit` to use `userProfilesApi.updateProfile()`
- [ ] Remove auth metadata update
- [ ] Fetch profile data from `user_profiles` table instead of auth metadata
- [ ] Test: Update profile and verify changes persist
- [ ] Test: Refresh page and verify data loads correctly
- [ ] Bonus: Add avatar upload to Supabase Storage

**File:** `src/app/dashboard/profile/page.tsx`

### Calendar Testing (1-2 hours)
- [ ] Test: Create a new event
- [ ] Test: Edit an existing event
- [ ] Test: Delete an event
- [ ] Test: Navigate between months
- [ ] Test: View different event types
- [ ] Fix any bugs discovered
- [ ] Test: Data persists after page refresh

**File:** `src/app/dashboard/calendar/page.tsx`

---

## 💪 Workout Tracking (High Priority)

### Phase 1: Basic Workout Display (2-3 hours)
- [ ] Import workout APIs at top of file
- [ ] Add state for user's workout programs
- [ ] Fetch programs using `workoutProgramsApi.getUserPrograms()`
- [ ] Replace hardcoded "upcoming workouts" with real data
- [ ] Replace hardcoded "workout history" with real data from `workout_logs`
- [ ] Add loading states
- [ ] Add empty states (when user has no programs)

**File:** `src/app/dashboard/workout/page.tsx`

### Phase 2: Workout Logging (4-6 hours)
- [ ] Create `src/components/workout/WorkoutLogger.tsx`
- [ ] Add form for logging sets/reps/weight per exercise
- [ ] Save to `workout_logs` and `exercise_logs` tables
- [ ] Show previous workout data for comparison
- [ ] Add success/error toasts
- [ ] Test: Log a complete workout
- [ ] Test: Data appears in history tab

### Phase 3: Exercise Library (2-3 hours)
- [ ] Create `src/components/workout/ExerciseLibrary.tsx`
- [ ] Fetch exercises using `exercisesApi.getAllExercises()`
- [ ] Add search functionality
- [ ] Add filter by muscle group
- [ ] Add "Add to Workout" functionality
- [ ] Seed database with common exercises (if empty)

### Phase 4: Program Builder (6-8 hours)
- [ ] Create `src/components/workout/ProgramBuilder.tsx`
- [ ] Form to create new program
- [ ] Add workout sessions to program
- [ ] Add exercises to sessions
- [ ] Set sets/reps/rest for each exercise
- [ ] Save complete program to database
- [ ] Test: Create program → View in list → Edit program

### Phase 5: Analytics (4-6 hours)
- [ ] Create exercise progression charts
- [ ] Show personal records (PRs)
- [ ] Display volume/intensity trends
- [ ] Add "Compare to Previous" feature
- [ ] Export workout data (optional)

---

## 🍽️ Meal Planning (High Priority)

### Phase 1: Basic Meal Display (2 hours)
- [ ] Import nutrition APIs
- [ ] Add state for nutrition plan and meals
- [ ] Fetch using `nutritionPlansApi.getUserNutritionPlans()`
- [ ] Fetch meals for active plan
- [ ] Replace hardcoded Monday data with real data
- [ ] Add loading states

**File:** `src/app/dashboard/meal-plan/page.tsx`

### Phase 2: Meal Logging (3-4 hours)
- [ ] Create `src/components/nutrition/MealLogger.tsx`
- [ ] Form to add meal with nutrition info
- [ ] Save to `meals` table
- [ ] Update daily totals calculation
- [ ] Test: Add meal → See updated totals

### Phase 3: Daily Nutrition Calculator (2-3 hours)
- [ ] Calculate totals from database meals
- [ ] Compare against nutrition plan targets
- [ ] Update progress bars with real data
- [ ] Add macro breakdown chart
- [ ] Handle multiple days of data

### Phase 4: Meal Library (3-4 hours)
- [ ] Create `src/components/nutrition/MealLibrary.tsx`
- [ ] Save frequently used meals
- [ ] Quick add from favorites
- [ ] Copy meals from previous days
- [ ] Edit saved meals

### Phase 5: Week View (2-3 hours)
- [ ] Make other day tabs functional
- [ ] Load meals for each day
- [ ] Quick navigation between days
- [ ] Week summary view

---

## 📊 Progress Tracking (New Page)

### Create Progress Page (4-6 hours)
- [ ] Create `src/app/dashboard/progress/page.tsx`
- [ ] Add weight tracking chart (line graph using recharts)
- [ ] Create body measurement form (waist, chest, arms, legs)
- [ ] Add photo upload (Supabase Storage)
- [ ] Display measurement history table
- [ ] Create before/after comparison view
- [ ] Test: Add progress entry → View in charts

**Components to Create:**
- [ ] `src/components/progress/WeightChart.tsx`
- [ ] `src/components/progress/MeasurementForm.tsx`
- [ ] `src/components/progress/PhotoUpload.tsx`

---

## 🎯 Goals Management (New Page)

### Create Goals Page (3-4 hours)
- [ ] Create `src/app/dashboard/goals/page.tsx`
- [ ] Display goals list with progress bars
- [ ] Create goal form (title, description, target, current)
- [ ] Add goal categories (weight, strength, nutrition, habits)
- [ ] Update goal progress
- [ ] Mark goals as completed
- [ ] Celebration animation for completed goals
- [ ] Test: Create goal → Update progress → Complete goal

**Components to Create:**
- [ ] `src/components/goals/GoalCard.tsx`
- [ ] `src/components/goals/GoalForm.tsx`
- [ ] `src/components/goals/GoalProgress.tsx`

---

## 🎨 UI/UX Improvements

### Error Handling
- [ ] Create `src/components/ErrorBoundary.tsx`
- [ ] Create `src/components/ErrorAlert.tsx`
- [ ] Add error boundaries to major pages
- [ ] Improve error messages across app
- [ ] Add error recovery options

### Loading States
- [ ] Create `src/components/LoadingSkeleton.tsx`
- [ ] Create `src/components/LoadingSpinner.tsx`
- [ ] Add loading skeletons to all data-fetching pages
- [ ] Test slow network conditions

### Toast Notifications
- [ ] Install `sonner` package
- [ ] Add Toaster component to root layout
- [ ] Replace alerts with toasts for success/error
- [ ] Add loading toasts for long operations

### Empty States
- [ ] Create helpful empty states for all features
- [ ] Add "Get Started" guides
- [ ] Provide example data or templates
- [ ] Make empty states visually appealing

---

## 🔧 Technical Improvements

### Form Validation
- [ ] Add Zod schemas for workout logging
- [ ] Add Zod schemas for meal logging
- [ ] Add validation for profile updates
- [ ] Add validation for goal creation
- [ ] Show inline validation errors

### Data Caching
- [ ] Consider adding React Query or SWR
- [ ] Cache frequently accessed data
- [ ] Implement optimistic updates
- [ ] Add data refresh triggers

### Performance
- [ ] Optimize image loading
- [ ] Code split large pages
- [ ] Lazy load heavy components
- [ ] Audit bundle size
- [ ] Test on slow devices

### Mobile Optimization
- [ ] Test all pages on mobile
- [ ] Fix touch target sizes
- [ ] Fix horizontal scrolling issues
- [ ] Optimize forms for mobile input
- [ ] Test on actual mobile devices

---

## 📱 Testing Checklist

### Manual Testing
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test with empty database
- [ ] Test with full database
- [ ] Test error scenarios
- [ ] Test on different screen sizes
- [ ] Test on mobile devices
- [ ] Test with slow network
- [ ] Test offline behavior

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

### User Flows
- [ ] New user signup → onboarding → first workout
- [ ] Log workout → view history → see progress
- [ ] Create meal plan → log meals → view nutrition
- [ ] Set goal → track progress → complete goal
- [ ] Upload progress photo → compare before/after

---

## 🚀 Deployment Prep

### Before Deploying
- [ ] Run `npm run build` successfully
- [ ] Fix any build warnings
- [ ] Test production build locally
- [ ] Verify environment variables
- [ ] Test Supabase connection in production
- [ ] Check RLS policies work correctly
- [ ] Verify file upload works (if implemented)
- [ ] Test authentication flows
- [ ] Check error reporting

### After Deploying
- [ ] Test live site thoroughly
- [ ] Check API rate limits
- [ ] Monitor error logs
- [ ] Test with real users
- [ ] Gather feedback
- [ ] Create priority bug list

---

## 📝 Documentation

### Developer Documentation
- [ ] Document environment setup
- [ ] Document database schema
- [ ] Document API functions
- [ ] Add code comments to complex functions
- [ ] Create component documentation

### User Documentation
- [ ] Write user guide for workouts
- [ ] Write user guide for meal planning
- [ ] Create FAQ section
- [ ] Add tooltips for complex features
- [ ] Create video tutorials (optional)

---

## 📈 Analytics & Monitoring

### Setup
- [ ] Add error tracking (Sentry, LogRocket, etc.)
- [ ] Add analytics (Posthog, Mixpanel, etc.)
- [ ] Track key user actions
- [ ] Monitor performance metrics
- [ ] Set up uptime monitoring

### Key Metrics to Track
- [ ] User signups
- [ ] Feature usage (workouts logged, meals logged)
- [ ] User retention
- [ ] Error rates
- [ ] Page load times

---

## 🎊 Nice-to-Have Features

### Future Enhancements
- [ ] Social features (share workouts)
- [ ] Export data (PDF reports)
- [ ] Import data from other apps
- [ ] Workout templates marketplace
- [ ] Meal plan generator (AI)
- [ ] Voice logging for workouts
- [ ] Apple Health / Google Fit integration
- [ ] Wearable device sync
- [ ] Progressive web app (PWA)
- [ ] Offline mode

---

## Progress Tracking

### Overall Completion

**Critical Features:**
- [ ] Workout Tracking: ⬜⬜⬜⬜⬜ 0/5
- [ ] Meal Planning: ⬜⬜⬜⬜⬜ 0/5
- [ ] Progress Page: ⬜⬜⬜⬜⬜ 0/5
- [ ] Goals Page: ⬜⬜⬜⬜⬜ 0/5
- [ ] Profile Fix: ⬜ 0/1
- [ ] Calendar Test: ⬜ 0/1

**Total Progress:** 0% complete

---

## Notes & Issues

### Blockers
(List any issues blocking progress)

### Questions
(List any questions or unclear requirements)

### Decisions Made
(Document important technical decisions)

### Bugs Found
(Track bugs discovered during implementation)

---

## Quick Reference

### Common Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
git status           # Check git status
git add .            # Stage all changes
git commit -m "..."  # Commit changes
git push             # Push to remote
```

### Useful File Locations
- API functions: `src/lib/supabase/dashboard-api.ts`
- Database schema: `src/lib/supabase/schema.sql`
- Dashboard pages: `src/app/dashboard/*/page.tsx`
- Components: `src/components/`
- Hooks: `src/hooks/`

### When Things Go Wrong
1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS policies
4. Check auth state
5. Try refreshing session
6. Check network tab for failed requests

---

**Remember:** The sleep tracking feature is a great reference for how to implement other features. When in doubt, look at how it's done there!

Good luck! 🚀

*Last Updated: July 3, 2026*
