# PERMIS2.0 - API Endpoints Documentation

## Base URL
`http://localhost:3001`

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### `POST /auth/register`
Register new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```
**Response**: `{ token, user }`

### `POST /auth/login`
Login user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**: `{ token, user }`

### `POST /auth/google`
Google OAuth authentication
```json
{
  "idToken": "google-id-token"
}
```
**Response**: `{ token, user }`

### `POST /auth/refresh`
Refresh authentication token
**Response**: `{ token }`

---

## User Endpoints

### `GET /profile`
Get current user profile
**Protected**: Yes

**Response**:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "avatar": "url",
  "xp": 150,
  "level": "Intermédiaire",
  "createdAt": "2026-06-24T00:00:00Z"
}
```

### `PATCH /profile`
Update user profile
**Protected**: Yes

**Request**:
```json
{
  "name": "New Name",
  "avatar": "new-avatar-url"
}
```

### `GET /profile/:id`
Get user profile by ID
**Protected**: No

**Response**: User object

---

## Series Endpoints

### `GET /series`
Get all training series
```
GET /series
```
**Response**:
```json
[
  {
    "id": "series-id",
    "name": "Série B1",
    "code": "B1",
    "description": "25 questions",
    "_count": { "questions": 25 }
  }
]
```

### `GET /series/:id`
Get series by ID
**Response**: Series with question count

### `GET /series/:id/questions`
Get all questions in a series
**Response**:
```json
[
  {
    "id": "question-id",
    "numero": 1,
    "enonce": "Question text...",
    "signalisation_visible": "STOP",
    "choices": [
      {
        "id": "choice-id",
        "text": "Answer text",
        "order": 1
      }
    ],
    "category": {
      "id": "cat-id",
      "label": "priorite"
    }
  }
]
```

### `GET /series/:id/progress`
Get user progress in a series
**Protected**: Yes

**Response**:
```json
{
  "series": { /* series object */ },
  "progress": {
    "totalAnswered": 10,
    "correctAnswers": 8,
    "accuracy": 80
  }
}
```

### `POST /series/:id/answer`
Submit answer to a question
**Protected**: Yes

**Request**:
```json
{
  "answer": "A"
}
```

**Response**:
```json
{
  "isCorrect": true,
  "explanation": "Explanation text...",
  "correctAnswers": ["A", "D"],
  "xpEarned": 10
}
```

---

## Question Endpoints

### `GET /questions`
Get all questions (paginated)
```
GET /questions?skip=0&take=10
```

### `GET /questions/:id`
Get question by ID

### `GET /questions/random`
Get random questions
```
GET /questions/random?categoryId=cat-id&limit=10
```

### `GET /questions/category/:categoryId`
Get questions by category (paginated)

### `GET /questions/:id/stats`
Get question statistics
**Response**:
```json
{
  "question": { /* question */ },
  "stats": {
    "totalAttempts": 100,
    "correctAttempts": 75,
    "successRate": 75,
    "avgTimeSpent": 15
  }
}
```

### `POST /questions/:id/favorite`
Toggle question as favorite
**Protected**: Yes

**Response**: `{ isFavorite: boolean }`

### `GET /questions/favorites`
Get user favorite questions
**Protected**: Yes

---

## Category Endpoints

### `GET /categories`
Get all categories
**Response**:
```json
[
  {
    "id": "cat-id",
    "label": "priorite",
    "description": "Priority rules",
    "couleur": "#16A34A",
    "icone": "🚦"
  }
]
```

### `GET /categories/:id`
Get category by ID

---

## Lesson Endpoints

### `GET /lessons`
Get all lessons (paginated)

### `GET /lessons/:id`
Get lesson by ID
**Response**:
```json
{
  "id": "lesson-id",
  "categoryId": "cat-id",
  "titre": "Lesson title",
  "contenu": "Lesson content...",
  "points_cles": ["key point 1", "key point 2"],
  "exceptions": [],
  "erreurs_frequentes": [],
  "regles": [],
  "illustrations": []
}
```

### `GET /lessons/category/:categoryId`
Get lessons by category

### `POST /lessons/:id/favorite`
Toggle lesson as favorite
**Protected**: Yes

### `GET /lessons/favorites`
Get favorite lessons
**Protected**: Yes

---

## Exam Endpoints

### `POST /exams/start`
Start new exam (40 random questions)
**Protected**: Yes

**Request** (optional):
```json
{
  "numberOfQuestions": 40
}
```

**Response**:
```json
{
  "examId": "exam-id",
  "startedAt": "2026-06-24T00:00:00Z",
  "duration": 1800000,
  "totalQuestions": 40,
  "questions": [ /* array of questions */ ]
}
```

### `GET /exams/:id`
Get exam status
**Protected**: Yes

**Response**:
```json
{
  "examId": "exam-id",
  "status": "in_progress",
  "timeRemaining": 1500000,
  "questionsAnswered": 10,
  "totalQuestions": 40
}
```

### `POST /exams/:id/answer`
Submit answer during exam
**Protected**: Yes

**Request**:
```json
{
  "questionId": "question-id",
  "answer": "A",
  "timeSpent": 15
}
```

**Response**:
```json
{
  "isCorrect": true,
  "explanation": "...",
  "correctAnswers": ["A"],
  "xpEarned": 10
}
```

### `POST /exams/:id/submit`
Complete exam
**Protected**: Yes

**Response**:
```json
{
  "examId": "exam-id",
  "result": {
    "score": 30,
    "percentage": 75,
    "passed": true,
    "timeUsed": 1200,
    "xpEarned": 300,
    "message": "Felicitations!..."
  }
}
```

### `GET /exams/:id/results`
Get exam results
**Protected**: Yes

**Response**:
```json
{
  "examId": "exam-id",
  "score": 30,
  "percentage": 75,
  "passed": true,
  "timeUsed": 1200,
  "totalTime": 1800,
  "startedAt": "2026-06-24T00:00:00Z",
  "completedAt": "2026-06-24T00:30:00Z",
  "categoryBreakdown": {
    "priorite": 80,
    "vitesse": 70,
    "intersection": 75
  },
  "xpEarned": 300
}
```

### `GET /exams/history/list`
Get user exam history (paginated)
**Protected**: Yes

---

## Statistics Endpoints

### `GET /statistics/overview`
Get overall statistics
**Protected**: Yes

**Response**:
```json
{
  "totalExams": 5,
  "overallAccuracy": 75,
  "bestScore": 85,
  "totalTime": 12000,
  "totalCorrectAnswers": 150
}
```

### `GET /statistics/category/:categoryId`
Get category statistics
**Protected**: Yes

### `GET /statistics/progress`
Get progress over time
**Protected**: Yes

---

## Traffic Signs Endpoints

### `GET /traffic-signs`
Get all traffic signs (paginated)

**Response**:
```json
[
  {
    "id": "sign-id",
    "name": "STOP",
    "meaning": "Stop completely",
    "category": "Interdiction",
    "description": "...",
    "image": "url"
  }
]
```

### `GET /traffic-signs/:id`
Get sign by ID

### `GET /traffic-signs/search`
Search traffic signs
```
GET /traffic-signs/search?q=stop
```

### `GET /traffic-signs/category/:category`
Get signs by category

---

## Gamification Endpoints

### `GET /gamification/badges`
Get user badges
**Protected**: Yes

**Response**:
```json
[
  {
    "id": "badge-id",
    "name": "first_test",
    "description": "Completed first test",
    "icon": "🏆",
    "unlockedAt": "2026-06-24T00:00:00Z"
  }
]
```

### `GET /gamification/leaderboard`
Get global leaderboard
```
GET /gamification/leaderboard?limit=100
```

**Response**:
```json
[
  {
    "id": "user-id",
    "name": "User Name",
    "avatar": "url",
    "xp": 500,
    "level": "Confirmé"
  }
]
```

### `GET /gamification/rank`
Get user rank
**Protected**: Yes

**Response**:
```json
{
  "rank": 42,
  "totalUsers": 1000,
  "xp": 500,
  "level": "Confirmé"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Add rate limiting before production

---

## Pagination

List endpoints support pagination:
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to return (default: 10)

**Response Format**:
```json
{
  "data": [ /* array of items */ ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

---

## WebSocket (Future)

Not yet implemented. Planned for real-time features:
- Live leaderboard updates
- Streak notifications
- Achievement announcements

---

## API Testing

### Using Swagger UI
- Available at: `http://localhost:3001/api/docs`
- All endpoints documented with examples
- Can test directly in browser

### Using cURL

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass","name":"Test"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Protected endpoint
curl -X GET http://localhost:3001/profile \
  -H "Authorization: Bearer {token}"
```

### Using Postman

1. Import Swagger: `http://localhost:3001/api/json`
2. Set Authorization type to "Bearer Token"
3. Paste token from login response
4. Test endpoints

---

## Versioning

Currently on API v1 (implied by routes)

Future versioning plan:
- Prefix routes with `/api/v1`, `/api/v2`, etc.
- Maintain backward compatibility
- Deprecation notices in headers

---

Last Updated: 2026-06-24

For detailed implementation details, see `DEVELOPMENT_GUIDE.md`
