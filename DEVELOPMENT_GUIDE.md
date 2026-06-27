# PERMIS2.0 - Development Continuation Guide

## Quick Start for Next Developer

### Understanding the Architecture

The project follows **Clean Architecture** with a monorepo structure:

```
permis2.0/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utilities
│   ├── hooks/        # React hooks
│   ├── ui/           # UI component library
│   └── shared/       # Constants
└── .claude/          # Claude Code configuration
```

### Key Files to Know

**Frontend**
- `apps/web/src/app/training/[code]/page.tsx` - Training questions UI
- `apps/web/src/components/TrainingComponents.tsx` - Reusable training components
- `apps/web/src/store/trainingStore.ts` - Training state management

**Backend**
- `apps/api/src/exam/exam.service.ts` - Exam system logic
- `apps/api/src/gamification/gamification.service.ts` - XP/streak/badges
- `apps/api/src/app.module.ts` - Module registration

**Data**
- `serie_B1.json`, `serie_B2.json`, `serie_B3.json` - Question data
- `categories_et_meta.json` - Categories metadata
- `fiches_theoriques.json` - Lessons/theory

---

## Current Sprint Status (Sprint 5)

### What's Done
- ✅ Sprint 4 Training UI fully implemented
- ✅ Sprint 5 Exam Service backend (95%)
- ✅ Sprint 6 Gamification Service foundation

### What's Next
1. Create Exam UI component (timer, questions, results)
2. Integrate exam endpoints in frontend
3. Test exam flow end-to-end
4. Implement gamification UI (badges, leaderboard)

---

## How to Continue Development

### Running the Project

```bash
# Start development services
npm run dev

# Start specific service
npm run dev --workspace=@permis2.0/web
npm run dev --workspace=@permis2.0/api

# Run tests
npm run test
npm run test:e2e

# Linting and formatting
npm run lint
npm run format
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name description_here

# Push to database
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Open Prisma Studio
npx prisma studio
```

### Common Tasks

#### Adding a New API Endpoint

1. Create service method in `apps/api/src/[feature]/[feature].service.ts`
2. Create controller method in `apps/api/src/[feature]/[feature].controller.ts`
3. Add Swagger decorators for documentation
4. Register module in `app.module.ts` if new

**Example:**
```typescript
// service.ts
async getExample(id: string) {
  return this.prisma.example.findUnique({ where: { id } });
}

// controller.ts
@Get(':id')
@ApiResponse({ status: 200, description: 'Example found' })
async findById(@Param('id') id: string) {
  return this.exampleService.getExample(id);
}
```

#### Adding a Frontend Page

1. Create file in `apps/web/src/app/[feature]/page.tsx`
2. Use 'use client' directive for client components
3. Implement protected route if needed with `ProtectedRoute`
4. Add to navigation

**Example:**
```typescript
'use client';

import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function FeaturePage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  
  return (
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

#### Using the Training Store

```typescript
import { useTrainingStore } from '@/store/trainingStore';

const questions = useTrainingStore(s => s.questions);
const submitAnswer = useTrainingStore(s => s.submitAnswer);
const categoryStats = useTrainingStore(s => s.getCategoryStats());
```

---

## Sprint 5: Exam System Implementation Guide

### Backend (Already 95% Done)

The exam service is ready. You need to:

1. **Create Exam Endpoints Handlers** - Already in controller, may need minor fixes
2. **Create TypeScript Types** in `packages/types/`:

```typescript
export interface ExamStartRequest {
  numberOfQuestions?: number;
}

export interface ExamQuestion {
  id: string;
  enonce: string;
  signalisation_visible?: string;
  choices: Choice[];
  category: {
    id: string;
    label: string;
  };
}

export interface ExamResult {
  examId: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeUsed: number;
  categoryBreakdown: Record<string, number>;
}
```

### Frontend (To Be Built)

1. **Create Exam Store** - `apps/web/src/store/examStore.ts`

```typescript
interface ExamState {
  examId: string | null;
  timeRemaining: number;
  currentQuestionIndex: number;
  questions: ExamQuestion[];
  
  startExam: () => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  getTimeRemaining: () => number;
  completeExam: () => Promise<ExamResult>;
}
```

2. **Create Exam Pages**

- `apps/web/src/app/exam/page.tsx` - Exam start screen
- `apps/web/src/app/exam/[id]/page.tsx` - Exam questions
- `apps/web/src/app/exam/[id]/results/page.tsx` - Exam results

3. **Create Timer Component**

```typescript
// apps/web/src/components/ExamTimer.tsx
interface ExamTimerProps {
  timeRemaining: number;
  totalTime: number;
  onTimeUp: () => void;
}

export function ExamTimer({ timeRemaining, totalTime, onTimeUp }) {
  // Warning at 5 minutes
  // Auto-submit on 0
}
```

### Key Considerations

- **Timer Accuracy**: Use `setInterval` with server-time sync
- **Auto-submit**: Call `/exams/:id/submit` when time reaches 0
- **Prevention of Back**: Remove ability to go back in exam
- **Question Randomization**: Already handled by backend
- **Category Breakdown**: Already calculated by backend

---

## Sprint 6: Gamification Implementation Guide

### Services (Already 90% Done)

The gamification service has everything. You need to:

1. **Create Gamification Controller**

```typescript
@Controller('gamification')
export class GamificationController {
  @Get('badges')
  @UseGuards(AuthGuard('jwt'))
  async getBadges(@Request() req) {
    return this.gamificationService.getUserBadges(req.user.userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit = 100) {
    return this.gamificationService.getLeaderboard(limit);
  }

  @Get('rank')
  @UseGuards(AuthGuard('jwt'))
  async getRank(@Request() req) {
    return this.gamificationService.getLeaderboardRank(req.user.userId);
  }
}
```

2. **Create Gamification Module** - `apps/api/src/gamification/gamification.module.ts`

### Frontend (To Be Built)

1. **Update Profile Page** with:
   - Level display with progress bar
   - XP counter
   - Badges showcase
   - Daily streak indicator

2. **Create Leaderboard Page**
   - Top 100 users
   - User's rank
   - XP comparison

3. **Create Achievement Notifications**
   - Toast for badge unlocks
   - Modal for level-ups
   - Confetti animation for milestones

### Integration Points

When user answers correctly in training:
```typescript
// Already handled in SeriesService.submitAnswer()
if (isCorrect) {
  // XP already awarded
  const achievements = await gamificationService.checkAndUnlockAchievements(userId);
  // Send achievement notifications
}
```

---

## Testing Checklist

### Before Each Sprint Completion

- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run test` - All tests passing
- [ ] Check bundle size - No significant increase
- [ ] Manual testing on mobile device
- [ ] Check dark mode support
- [ ] Verify accessibility
- [ ] Test offline functionality
- [ ] Check Lighthouse score

### Critical User Flows to Test

1. **Training Series**
   - Start series → Answer questions → See results
   - Navigation (prev/next) works
   - Progress bar updates correctly
   - Category breakdown shows correctly

2. **Exam Flow**
   - Start exam → Answer all questions → See results
   - Timer counts down
   - Auto-submit on timeout
   - Cannot go back
   - Pass/fail determination correct

3. **Gamification**
   - XP earned correctly
   - Level updates on milestone
   - Streak increments daily
   - Badges unlock on conditions
   - Leaderboard ranks correctly

---

## Common Bugs & Fixes

### Issue: Animations Not Smooth on Mobile
**Solution**: Reduce animation duration, use `will-change` CSS, check GPU acceleration

### Issue: Timer Drifts Over Time
**Solution**: Sync client time with server periodically instead of using `setInterval`

### Issue: XP Not Updating
**Solution**: Check if transaction is complete before UI update

### Issue: Category Stats Show 0%
**Solution**: Ensure categoryId is passed in answer submission, not just letter

---

## Performance Optimization Tips

1. **Code Splitting**
   - Use Next.js dynamic imports for large components
   - Lazy load training pages

2. **Image Optimization**
   - Use Next.js `Image` component
   - Optimize signalisation images to SVG where possible

3. **Database Queries**
   - Add pagination to all list endpoints
   - Use `include`/`select` carefully to avoid N+1
   - Index frequently queried fields

4. **State Management**
   - Don't store large arrays in Zustand
   - Use selectors for derived state
   - Clean up listeners on unmount

---

## Style Guidelines

### Naming Conventions

- **Components**: PascalCase (`QuestionCard.tsx`)
- **Functions**: camelCase (`calculateAccuracy()`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_QUESTIONS`)
- **Classes**: PascalCase (`ExamService`)
- **Files**: kebab-case (`question-card.tsx`) or PascalCase for components

### Code Organization

```typescript
// 1. Imports
import { Module } from '@nestjs/common';

// 2. Types/Interfaces
interface Example {}

// 3. Class/Function Definition
export class ExampleService {}

// 4. Methods (public → private)
public method() {}
private helper() {}
```

### CSS Classes

- Use TailwindCSS utilities first
- Avoid custom CSS unless necessary
- Mobile-first responsive design
- Dark mode support with `dark:` prefix

---

## Debugging Tips

### Backend Debugging

```typescript
// Add logging
console.log('Debug info:', variable);

// Use Prisma Studio
npx prisma studio

// Check database directly
// In Prisma Studio: inspect models and data
```

### Frontend Debugging

```typescript
// React DevTools
// - Check component tree
// - Monitor state changes

// Network tab
// - Verify API calls
// - Check response times

// Console warnings
// - Fix TypeScript errors
// - Clean up console logs
```

### Common Debug Patterns

```typescript
// Log store state
const state = useTrainingStore.getState();
console.log('Training state:', state);

// Check authentication
const user = useAuthStore(s => s.user);
console.log('Current user:', user);

// Monitor performance
console.time('operation-name');
// ... code ...
console.timeEnd('operation-name');
```

---

## Resources & Links

- **Prisma Docs**: https://www.prisma.io/docs/
- **NestJS Docs**: https://docs.nestjs.com/
- **Next.js Docs**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion/
- **Zustand**: https://github.com/pmndrs/zustand

---

## Questions? Need Help?

1. Check existing implementations in same feature
2. Look at similar patterns in other modules
3. Review the SPRINT_CONTINUITY.md for context
4. Check the git log for recent changes
5. Ask in team communication channel

---

Last Updated: 2026-06-24

**Next Developer Handoff**: Remember to update this file with your progress and learnings!
