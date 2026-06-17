---
trigger: always_on
---

# 1. Code Generation & Execution
- STRICT RULE: NEVER use placeholders, comments like `// ... rest of the code`, or `TODOs`. Always generate complete, fully working, and implementable code blocks.
- Prioritize writing clean, modular, and DRY (Don't Repeat Yourself) code. Apply SOLID principles where applicable.
- Ensure strict type safety and properly handle edge cases.

# 2. Communication & Responses
- Be extremely concise. Skip pleasantries, introductions, and lengthy explanations. Go straight to the code or the technical answer.
- Only add comments to explain the *WHY* (complex logic, architectural decisions), never the *WHAT* (obvious syntax).
- If a request is ambiguous, ask a clarifying question before generating large chunks of incorrect code.

# 3. Error Handling & Security
- Always implement robust error handling (e.g., try/catch blocks) for async operations, file I/O, database interactions, and network requests.
- Log errors gracefully with meaningful messages; do not silently swallow errors.
- Never hardcode secrets, API keys, or database credentials. Always assume they come from environment variables.

# 4. Architecture & Environment Context
- Respect the existing project structure (e.g., the strict separation between `frontend` and `backend` services).
- When writing or modifying `Dockerfile` or `docker-compose.yaml`, use lightweight, secure base images and follow containerization best practices.
- For SQL files and database queries, prioritize parameterized queries to prevent SQL injection and ensure indexing best practices.
- Maintain consistent naming conventions: camelCase for variables/functions, PascalCase for classes/interfaces, UPPER_SNAKE_CASE for constants.

# 5. React (Frontend) Specifics
- STRICT RULE: Use Functional Components and React Hooks exclusively. Never generate React Class components.
- Keep component state as local as possible. Extract complex logic into custom hooks to keep components clean.
- Write semantic HTML and always include necessary accessibility (a11y) attributes (e.g., `alt` tags, `aria-labels`).
- Avoid premature optimization, but use `useMemo`, `useCallback`, and `React.memo` correctly when dealing with heavy computations or preventing unnecessary re-renders in large lists.
- For side effects, ensure `useEffect` hooks have the correct dependency arrays to prevent infinite loops.
- Styling: STRICT RULE: Use Tailwind CSS exclusively for styling. Apply utility classes directly to JSX elements. NEVER use inline styles (style={{...}}) or create external CSS/SCSS files unless for dynamically calculated values that Tailwind cannot handle.
- Tailwind Best Practices: Group Tailwind classes logically (e.g., layout, spacing, typography, colors). When handling conditional classes, strictly use template literals or utility libraries like clsx / tailwind-merge to avoid class conflicts.
- State Management: Use [Zustand / Redux Toolkit / Context API] for global state. Avoid deep prop-drilling.

# 6. Node.js (Backend) Specifics
- STRICT RULE: Always use `async/await` for asynchronous operations. Never use raw callbacks or long `.then().catch()` chains.
- Enforce a clean, layered architecture: separate Routes, Controllers, and Services. Keep controllers thin by moving business logic into the Service layer.
- Always validate incoming API request payloads (body, params, query) before processing the request.
- Implement centralized error-handling middleware. Never allow unhandled promise rejections to crash the server.
- Standardize API responses to follow a consistent JSON format across all endpoints, for example: `{ success: boolean, data: any, message: string }`.
- Ensure proper connection pooling and resource cleanup when interacting with the database.

# 7. Testing & Quality Assurance
- Write unit tests for all complex business logic in the Service layer using [Jest/Vitest].
- For React components, use React Testing Library. Focus on testing user behavior and accessibility, NOT implementation details.
- Mock external dependencies (databases, external APIs) in unit tests.
 