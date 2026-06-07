# Post-Game AI Review — Security & Privacy

## Implementation Requirements

### API Security
- [x] Use Groq's documented OpenAI-compatible endpoint: `https://api.groq.com/openai/v1/chat/completions`
- [x] Server-side fetch only from Next.js API routes
- [x] Do not call Groq from client components
- [x] Use correct OpenAI-compatible chat completion request shape
- [x] No client-side API keys exposed
- [x] No real API keys committed to repo

### Request Validation
- [x] Request-size validation: moves max 300 half-moves, question max 1000 characters
- [x] Overly large payloads rejected with friendly 400 errors
- [x] Response size limits: content truncated to 10000 chars

### Rate Limiting
- [x] In-memory rate limiter: ~10 review/chat requests per IP per 10 minutes
- [x] Simple alpha-stage implementation (not distributed)
- [x] Rate limit exceeded returns 429 with friendly message

### Prompt Injection Hardening
- [x] System prompt includes clear boundaries about following user instructions
- [x] Prevents prompts asking to reveal hidden rules, API keys, or stop acting as coach
- [x] User question validated and trimmed before sending to provider
- [x] System prompt warns against showing raw code or configuration

### Response Handling
- [x] Correct response parsing from OpenAI-compatible endpoint
- [x] No raw JSON fallback to users
- [x] Friendly error on response parse failure
- [x] Only safe server-side diagnostics logged (no full responses, no keys)
- [x] Error messages do not expose implementation details

### Privacy
- [x] Privacy wording updated to accurately reflect payload contents
- [x] Payload includes: moves, result, final FEN (internal only), bot level, metadata
- [x] Privacy notice: "For review, the app sends this game's moves and basic game details. No personal information is sent."
- [x] No personal information (account, email, location) sent to Groq
- [x] No raw FEN/PGN shown in beginner UI

### User Control
- [x] No automatic API calls until user clicks "Review my game"
- [x] Move-by-move detail triggered explicitly by user click
- [x] Chat questions are optional user input
- [x] Review cleared when New Game is clicked
- [x] Review cleared when Undo returns to in-game state

## Future Considerations
- Rate limiting should move to Redis or Vercel KV for multi-instance deployments
- Consider adding request signing or nonce to prevent replay attacks
- Monitor Groq spending to detect abuse early
- Log review requests (IP, timestamp) for abuse detection
- Consider adding CAPTCHA or email verification for alpha access
