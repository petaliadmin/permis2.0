# PERMIS2.0 - Next Development Steps

## Current Status (as of 2026-06-24)
- **Sprint 4**: ✅ COMPLETE
- **Sprint 5**: 95% COMPLETE (backend done, frontend needed)
- **Sprint 6**: 90% COMPLETE (backend done, frontend needed)
- **Sprint 7-12**: Ready to start

---

## Immediate Next Steps (This Week)

### Sprint 5.1: Exam Frontend Store
**Estimated Time**: 6-8 hours

#### Task List
- [ ] Create `apps/web/src/store/examStore.ts`
- [ ] Implement ExamState interface with:
  - [ ] examId management
  - [ ] timeRemaining countdown
  - [ ] currentQuestionIndex
  - [ ] questions array
  - [ ] answers tracking
- [ ] Add methods:
  - [ ] `startExam()` - Call POST /exams/start
  - [ ] `submitAnswer()` - Call POST /exams/:id/answer
  - [ ] `completeExam()` - Call POST /exams/:id/submit
  - [ ] `getTimeRemaining()` - Calculate remaining time
  - [ ] `handleTimeout()` - Auto-submit on time up

#### Code Template
```typescript
// apps/web/src/store/examStore.ts
import { create } from 'zustand';
import type { ExamQuestion, ExamResult } from '@permis2.0/types';

interface ExamState {
  // State
  examId: string | null;
  timeRemaining: number; // milliseconds
  timeTotal: number;
  currentQuestionIndex: number;
  questions: ExamQuestion[];
  answers: Map<string, string>;
  isTimeUp: boolean;
  
  // Methods
  startExam: (numberOfQuestions?: number) => Promise<void>;
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => Promise<void>;
  completeExam: () => Promise<ExamResult>;
  updateTimeRemaining: () => void;
  getTimeRemaining: () => number;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  // ... implementation
}));
```

### Sprint 5.2: Exam UI Components
**Estimated Time**: 8-10 hours

#### Components to Create
- [ ] `ExamTimerComponent` - Countdown display
- [ ] `ExamScreenComponent` - Full exam layout
- [ ] `ExamResultsComponent` - Results display

#### Key Features
- [ ] Timer with color warnings (red at 5 min)
- [ ] Question counter (X / 40)
- [ ] Cannot go back to previous questions
- [ ] Auto-submit on timeout
- [ ] Full-screen exam mode

#### Code Structure
```
apps/web/src/components/
├── ExamTimer.tsx           (countdown + warnings)
├── ExamQuestion.tsx        (single question display)
├── ExamResults.tsx         (results card)
└── ExamLayout.tsx          (full screen layout)
```

### Sprint 5.3: Exam Pages
**Estimated Time**: 6-8 hours

#### Pages to Create
- [ ] `apps/web/src/app/exam/page.tsx` - Start screen
- [ ] `apps/web/src/app/exam/[id]/page.tsx` - Questions
- [ ] `apps/web/src/app/exam/[id]/results/page.tsx` - Results

#### Features
- [ ] Rules and instructions on start screen
- [ ] Start exam button
- [ ] Full-screen question display
- [ ] Timer visible and updating
- [ ] Results with breakdown
- [ ] Action buttons (retry, home, leaderboard)

---

## Short Term (Next 2-3 Weeks)

### Sprint 6.1: Gamification Backend Integration
**Estimated Time**: 4-6 hours

#### Implementation
- [ ] Create `apps/api/src/gamification/gamification.controller.ts`
- [ ] Create `apps/api/src/gamification/gamification.module.ts`
- [ ] Implement endpoints:
  - [ ] GET /gamification/badges
  - [ ] GET /gamification/leaderboard
  - [ ] GET /gamification/rank

#### Integration Points
- [ ] Call from ExamService on exam completion
- [ ] Award XP in SeriesService
- [ ] Check achievements after answer

### Sprint 6.2: Profile & Gamification UI
**Estimated Time**: 12-16 hours

#### Components
- [ ] Badge showcase component
- [ ] Level progress bar
- [ ] Streak indicator
- [ ] XP display

#### Pages
- [ ] Enhance profile page with gamification
- [ ] Create leaderboard page
- [ ] Create achievements showcase

#### Animations
- [ ] Level-up animation
- [ ] Badge unlock notification
- [ ] Confetti on milestone
- [ ] Streak milestone celebration

---

## Testing Checklist

### For Each Component
- [ ] Unit tests passing
- [ ] Manual testing on mobile
- [ ] Accessibility audit
- [ ] Dark mode tested
- [ ] Loading states work
- [ ] Error states handled

### Integration Tests
- [ ] Complete exam flow
- [ ] Answer submission → XP award → Badge unlock
- [ ] Timer accuracy
- [ ] Auto-submit on timeout
- [ ] Results calculation correct

---

## Performance Optimization Checklist

- [ ] Image optimization (signalisation)
- [ ] Bundle size check
- [ ] Database query optimization
- [ ] Lighthouse audit (target > 95)
- [ ] Core Web Vitals check
- [ ] Mobile performance test

---

## Code Quality Checklist

- [ ] TypeScript strict mode
- [ ] ESLint passing
- [ ] Prettier formatted
- [ ] No console.log in production
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Empty states handled

---

## Deployment Preparation

- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Docker images built
- [ ] Health checks implemented
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry)

---

## Sprint 7-12 Quick Preview

### Sprint 7: Traffic Signs (Week 4)
- Extract signs from question data
- Create signs module backend
- Build signs gallery frontend
- Implement sign quiz game

### Sprint 8: Statistics (Week 5)
- Aggregate user performance data
- Create charts with Recharts
- Build statistics dashboard
- Add time range filters

### Sprint 9: AI Coach (Week 6)
- Analyze user mistakes
- Generate personalized recommendations
- Create adaptive quizzes
- Learning path suggestions

### Sprint 10: PWA & Offline (Week 7)
- Service Worker setup
- Offline content caching
- Install prompts
- Push notifications

### Sprint 11: Admin Dashboard (Week 8)
- Content management CRUD
- User management
- Platform statistics
- System monitoring

### Sprint 12: Testing & Launch (Week 9)
- Test coverage to >80%
- Performance optimization
- Internationalization
- Security hardening
- Production deployment

---

## Git Workflow

### Before Starting
```bash
git checkout develop
git pull origin develop
git checkout -b feature/sprint-5-exam
```

### While Working
```bash
# Commit frequently
git add .
git commit -m "feat(exam): implement timer component"

# Push to branch
git push origin feature/sprint-5-exam
```

### When Done
```bash
# Create pull request
git push origin feature/sprint-5-exam
# On GitHub: Create PR to develop

# After review and approval
git checkout develop
git pull origin develop
git merge feature/sprint-5-exam
git push origin develop
```

---

## Resources & Tools

### Development
- VS Code with ESLint extension
- React DevTools browser extension
- Prisma Studio: `npx prisma studio`
- Swagger UI: `http://localhost:3001/api/docs`
- Mobile testing: Use Responsive Design Mode in browser

### Testing
- Vitest for unit tests
- Playwright for E2E
- Lighthouse for performance
- aXe for accessibility

### Deployment
- Docker for containerization
- GitHub Actions for CI/CD
- Vercel for frontend hosting
- Database migrations automation

---

## Common Pitfalls to Avoid

1. **Timer Drift**: Use server time sync instead of relying on `setInterval`
2. **XP Not Awarded**: Verify transaction is complete before UI update
3. **Missing Category ID**: Ensure questionId carries category info
4. **Mobile Testing**: Always test on real device, not just browser
5. **Dark Mode**: Apply `dark:` class variants to all new components
6. **Accessibility**: Use semantic HTML, add ARIA labels, test with keyboard

---

## Questions to Answer Before Each Sprint

- [ ] Have I read the relevant documentation?
- [ ] Do I understand the API endpoints?
- [ ] Have I tested on mobile?
- [ ] Are there any security concerns?
- [ ] Is error handling complete?
- [ ] Are all edge cases covered?
- [ ] Is the code performant?
- [ ] Is accessibility considered?

---

## Success Criteria for Each Sprint

### Sprint 5
- ✅ Exam can be started and completed
- ✅ Timer counts down correctly
- ✅ Results display correctly
- ✅ Cannot go back in exam
- ✅ Auto-submit on timeout works
- ✅ Mobile optimized
- ✅ Lighthouse > 95

### Sprint 6
- ✅ XP awarded correctly
- ✅ Levels unlock at thresholds
- ✅ Streaks track daily activity
- ✅ Badges unlock on conditions
- ✅ Leaderboard shows correct rankings
- ✅ Notifications appear
- ✅ Animations smooth

---

## Schedule

Based on current progress:

| Sprint | Week | Start | End | Status |
|--------|------|-------|-----|--------|
| 4 | 1-2 | Jun 24 | Jun 28 | ✅ Done |
| 5 | 3-4 | Jul 1 | Jul 12 | 🔄 In Progress |
| 6 | 5-6 | Jul 15 | Jul 26 | ⏳ Pending |
| 7 | 7-8 | Jul 29 | Aug 9 | ⏳ Pending |
| 8 | 9-10 | Aug 12 | Aug 23 | ⏳ Pending |
| 9 | 11-12 | Aug 26 | Sep 6 | ⏳ Pending |
| 10 | 13-14 | Sep 9 | Sep 20 | ⏳ Pending |
| 11 | 15-16 | Sep 23 | Oct 4 | ⏳ Pending |
| 12 | 17-18 | Oct 7 | Oct 18 | ⏳ Pending |

**Target Launch**: October 2026 ✅

---

## Key Contact Points

- Frontend Lead: Review training UI patterns before building exam
- Backend Lead: Verify exam service endpoints before integration
- DevOps: Prepare deployment pipeline for Sprint 12
- QA: Plan mobile testing for Sprint 5
- Design: Ensure gamification animations match design system

---

## Final Notes

The foundation is solid. The patterns are established. The architecture is sound.

**What remains**: Execution, testing, and optimization.

Each sprint builds on the previous one. Follow the patterns set in Sprint 4.

If stuck: Check `DEVELOPMENT_GUIDE.md` first, then ask team.

Good luck! 🚀

---

Last Updated: 2026-06-24
Next Review: After Sprint 5 completion
