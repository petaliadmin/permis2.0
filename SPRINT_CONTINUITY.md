# PERMIS2.0 - Sprint Continuity & Development Plan

## Current Status
- **Date**: 2026-06-24
- **Completed**: Sprint 1-3 Foundation, Auth, Data Import & Categories
- **Next**: Sprint 4 - Training Series & Questions (Mobile-First UX)

---

## Sprint 4: Training Series & Questions
**Duration**: Week 7-8  
**Status**: IN PROGRESS

### 4.1 Backend Enhancements

#### Series Module Improvements
- [x] Basic Series service exists
- [ ] Add pagination to `GET /series`
- [ ] Add filtering by code
- [ ] Add series statistics
- [ ] Implement series completion detection

#### Question Module Improvements
- [x] Basic Question service exists
- [ ] Add question batching (return questions array for series)
- [ ] Implement question randomization within series
- [ ] Add question difficulty levels (future)
- [ ] Track question attempt history per user

#### Answer Submission System
- [ ] Create AnswerResult DTO with detailed feedback
- [ ] Implement answer validation with detailed explanations
- [ ] Track answer timing information
- [ ] Store answer history for analytics

#### New Endpoints
```
POST /series/:code/start           - Start training session
GET /series/:code/next-question    - Get next question
POST /questions/:id/check-answer   - Validate answer with detailed feedback
GET /progress/series/:code         - Get user progress
POST /progress/reset/:seriesCode   - Reset series progress
```

### 4.2 Frontend Training UI

#### Series Selection Page
- [x] Exists but needs enhancements
- [ ] Add progress rings showing %
- [ ] Add best score display
- [ ] Add last attempt date
- [ ] Mobile: Full-width cards
- [ ] Animations: Entrance animations with Framer Motion

#### Question Screen (Mobile-First)
- [x] Basic structure exists
- [ ] Mobile optimizations:
  - Full-screen question display
  - Large touch targets (56px minimum)
  - Swipe gestures for navigation
  - Haptic feedback on answer selection
- [ ] Signalisation display improvements:
  - Render actual sign images/SVG
  - Add image zoom on tap
  - Support for colored signs
- [ ] Answer feedback animations:
  - Correct answer: Green highlight + checkmark animation
  - Wrong answer: Red highlight + X animation
  - Explanation slide-in animation
- [ ] Progress indicators:
  - Clear progress bar
  - Question counter (current/total)
  - Accuracy indicator

#### Results Screen
- [x] Placeholder exists
- [ ] Display:
  - Total score (X/25 or X%)
  - Accuracy percentage
  - Time spent
  - Category breakdown
  - Mistakes review
- [ ] Actions:
  - Review missed questions
  - Retry series
  - Go to categories
- [ ] Animations:
  - Score reveal animation
  - Category bars animation
  - Confetti for >80% score

### 4.3 Training Store Improvements

```typescript
// Current gaps to fill
interface TrainingState {
  // Session management
  sessionId: string | null;
  sessionStartTime: Date | null;
  sessionTimeSpent: number; // ms
  
  // Questions array instead of single question
  questions: Question[];
  questionsMap: Map<string, Question>; // for quick lookup
  
  // Answer tracking
  answerResults: Map<string, AnswerResult>; // detailed results per question
  
  // Statistics
  sessionAccuracy: number;
  sessionStats: {
    totalQuestions: number;
    correctAnswers: number;
    averageTimePerQuestion: number;
    categoryBreakdown: Record<string, number>; // accuracy per category
  };
}
```

### 4.4 Types & DTOs

Create `packages/types/training.ts`:
```typescript
export interface AnswerResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswers: string[];
  timeSpent: number; // seconds
  xpEarned: number;
  categoryId: string;
}

export interface SeriesProgress {
  seriesCode: string;
  totalAttempts: number;
  bestScore: number; // percentage
  lastAttemptDate: Date;
  categoryAccuracy: Record<string, number>;
}

export interface TrainingSession {
  id: string;
  userId: string;
  seriesCode: string;
  startedAt: Date;
  completedAt?: Date;
  questions: Question[];
  answers: AnswerResult[];
  totalTime: number; // seconds
  accuracy: number;
}
```

### 4.5 UX Enhancements

#### Mobile-First Design
- Minimum 56px touch targets
- Full-width question cards
- Bottom-positioned action buttons
- Swipe navigation support
- No horizontal scrolling

#### Animations
- Question transition: Slide in from right
- Correct answer: Green pulse + checkmark
- Wrong answer: Shake animation + red highlight
- Feedback card: Slide in from bottom
- Progress bar: Smooth linear animation

#### Accessibility
- Keyboard navigation (arrow keys for next/prev)
- Screen reader labels for signalisation
- High contrast mode support
- Font size adjustable text
- Alt text for all images

### 4.6 Data Seeding Enhancement

Update prisma seed to:
- [ ] Parse Choice letters (A, B, C, D) from JSON propositions
- [ ] Create Choice records with correct ordering
- [ ] Link Questions to Categories via categorie field
- [ ] Validate all foreign keys before seeding

---

## Sprint 5: Mock Exam System
**Duration**: Week 9-10

### 5.1 Exam Engine Backend
```
POST /exams/start              - Create exam session (40 random questions)
GET /exams/:id                 - Get exam status & current question
POST /exams/:id/answer         - Submit answer during exam
POST /exams/:id/submit         - Complete exam & get results
GET /exams/:id/results         - Get detailed exam results
GET /exams/history             - Get past exams
```

### 5.2 Timer System
- Server-side timer validation
- 30-minute countdown
- Warning at 5 minutes
- Auto-submit on timeout
- Time per question tracking

### 5.3 Exam UI
- Start screen with rules
- Full-screen exam mode
- Visible timer with color warnings
- Question counter
- Cannot go back feature
- Results page with analysis

---

## Sprint 6: Gamification System
**Duration**: Week 11-12

### 6.1 XP & Leveling
- XP rules: 10 points/correct answer, bonuses for streaks
- Levels: Débutant, Intermédiaire, Confirmé, Expert
- XP bar on profile
- Level-up notifications

### 6.2 Daily Streak
- Increment on daily activity
- 24-hour reset window
- Longest streak tracking
- Visual streak indicator

### 6.3 Badges & Achievements
- Achievement icons
- Unlock conditions
- Achievement notifications
- Profile showcase

### 6.4 Leaderboards (Optional)
- Global rankings
- Friend rankings
- Weekly/monthly resets

---

## Sprint 7: Traffic Signs Module
**Duration**: Week 13-14

### 7.1 Backend
- Extract signs from questions
- TrafficSign CRUD
- Sign categorization
- Search/filter endpoints

### 7.2 Frontend
- Signs gallery
- Sign detail view
- Search functionality
- Sign quiz game

---

## Sprint 8: Statistics & Analytics
**Duration**: Week 15-16

### 8.1 Statistics Service
- Aggregate user performance data
- Category breakdowns
- Progress trends
- Time analysis

### 8.2 Charts & Visualization
- Line charts (progress over time)
- Bar charts (category performance)
- Pie charts (success rates)
- Area charts (daily activity)

### 8.3 Statistics Dashboard
- Overview metrics
- Category performance
- Progress visualization
- Daily/weekly/monthly views

---

## Sprint 9: AI Coach & Personalization
**Duration**: Week 17-18

### 9.1 AI Coach
- Weakness detection
- Personalized recommendations
- Targeted quiz generation
- Learning path suggestions

### 9.2 Weak Area Detection
- Identify struggling categories
- Track improvement trends
- Performance alerts

---

## Sprint 10: PWA & Offline
**Duration**: Week 19-20

### 10.1 Service Worker
- Cache-first for static assets
- Network-first for API
- Stale-while-revalidate for data

### 10.2 Installability
- manifest.json
- App icons
- Install prompts
- Splash screen

### 10.3 Offline Content
- Cached lessons
- Downloaded questions
- Sync queue for answers

---

## Sprint 11: Admin Dashboard
**Duration**: Week 21-22

### 11.1 Content Management
- Category CRUD
- Question CRUD
- Lesson CRUD
- Bulk operations

### 11.2 User Management
- View all users
- User statistics
- Ban/unban users
- Reset progress

### 11.3 Platform Statistics
- User growth
- Popular questions
- Content analytics

---

## Sprint 12: Testing & Deployment
**Duration**: Week 23-24

### 12.1 Test Coverage
- Unit tests (>80%)
- Integration tests
- E2E tests

### 12.2 Performance
- Lighthouse > 95
- Core Web Vitals optimization
- Bundle optimization

### 12.3 Deployment
- Docker finalization
- CI/CD pipeline complete
- Production environment setup

---

## Development Priorities

### High Priority (Sprint 4-5)
1. Training UI responsiveness
2. Answer validation accuracy
3. Progress tracking correctness
4. Mobile gesture support
5. Test coverage for core flows

### Medium Priority (Sprint 6-8)
1. Gamification engagement
2. Analytics accuracy
3. Performance optimization
4. Offline functionality

### Nice-to-Have (Sprint 9-12)
1. AI recommendations
2. Admin tools
3. Advanced analytics
4. Social features

---

## Known Issues & TODOs

- [ ] Question Choice mapping needs testing (A, B, C, D order)
- [ ] Signalisation display needs real image/SVG support
- [ ] Timer component needs accessibility testing
- [ ] Offline sync conflict resolution
- [ ] Mobile gesture responsiveness needs real device testing
- [ ] Answer feedback animations need performance testing
- [ ] Results page category breakdown calculation

---

## Testing Strategy

### Unit Tests
- XP calculation logic
- Answer validation
- Progress calculation
- Scoring algorithms

### Integration Tests
- Series → Questions → Answers flow
- Progress update flow
- User statistics generation
- Badge unlock conditions

### E2E Tests
- Complete training series
- Mock exam flow
- Profile update flow
- Statistics dashboard load

### Performance Tests
- Lighthouse audit
- Load testing (multiple concurrent users)
- Database query optimization
- Bundle size verification

---

## Database Migrations Needed

1. Add `Choice` model relationships (already done)
2. Add training session tracking (new)
3. Add answer history (new)
4. Add user preferences (future)
5. Add analytics events (future)

---

## Next Immediate Actions

1. ✅ Create training page enhancements
2. ✅ Implement mobile-first CSS
3. ✅ Add swipe gesture support
4. ✅ Create answer feedback animations
5. ✅ Implement progress calculation
6. Test series loading on real devices
7. Implement results page
8. Add achievements tracking

