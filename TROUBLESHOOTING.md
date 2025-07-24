# NutriSnap Troubleshooting Guide

This document logs the errors encountered during the development of the NutriSnap application and details the steps taken to resolve them.

---

### 1. API Calls Failing with "Failed to fetch user's nutrient history"

-   **Symptom**: The admin panel would show a toast notification with the error `Failed to fetch user's nutrient history`. The Next.js console showed that calls to `/api/admin/history` were returning a `500 Internal Server Error`.
-   **Root Cause**: This was a multi-faceted issue:
    1.  An artificial `setTimeout` delay in the API route was causing client-side requests to time out.
    2.  The client-side `useAuth` hook was not proactively refreshing the Firebase ID token. The token obtained at login would expire, and subsequent API requests would fail because the server received an invalid token.
-   **Resolution**:
    -   The `setTimeout` was removed from the API route (`src/app/api/admin/history/route.ts`).
    -   The `useAuth` hook (`src/hooks/use-auth.tsx`) was updated to force a token refresh (`fbUser.getIdToken(true)`) whenever the user's authentication state was updated, ensuring all API calls are made with a fresh token.

---

### 2. Compilation Error: `Module has no exported member`

-   **Symptom**: The application failed to compile with TypeScript errors like `Module '"@/ai/flows/admin-flows"' has no exported member 'setAdminClaim'`.
-   **Root Cause**: This was caused by attempting to implement a "promote to admin" feature. I incorrectly renamed functions, created API routes that imported functions that didn't exist, and ultimately failed to provide the complete implementation.
-   **Resolution**:
    -   All changes related to the "promote to admin" feature were reverted.
    -   The unused API routes (`set-claim`, `set-role`) were deleted.
    -   The UI elements (button, dialog) were removed from `src/app/(app)/admin/page.tsx`.
    -   The `admin-flows.ts` file was cleaned of any related, incomplete code. This restored the application to a stable, working state.

---

### 3. Runtime Error: `useCallback is not defined`

-   **Symptom**: The admin page would crash with a runtime error in the browser console: `Runtime Error: Error: useCallback is not defined`.
-   **Root Cause**: The `AdminPage` component (`src/app/(app)/admin/page.tsx`) was using the `useCallback` hook without importing it from the `react` library.
-   **Resolution**:
    -   Added `useCallback` to the import statement at the top of `src/app/(app)/admin/page.tsx`: `import { useState, useEffect, useCallback } from 'react';`

---

### 4. JSON Parsing Error with Service Account Credentials

-   **Symptom**: The Firebase Admin SDK would fail to initialize, causing all backend API routes to fail. This manifested as a generic 500 error.
-   **Root Cause**: The `private_key` value in `firebase-adminsdk.json` contained literal newline characters (`\n`). JSON strings cannot contain unescaped newlines.
-   **Resolution**:
    -   The `firebase-adminsdk.json` file was corrected by replacing each newline character (`\n`) with its properly escaped version (`\\n`). This made the JSON file valid and parsable.

---

### 5. API Error: `history` route returning 500 for a specific user

-   **Symptom**: The API call to `/api/admin/history` would fail, but only when triggered from the user data modal in the admin panel. The user ID being passed was `undefined`.
-   **Root Cause**: There was a mismatch between the data structure of the `User` object being passed in the component and the property being accessed. The code was calling `user.id` when the property on the object was actually `user.uid`.
-   **Resolution**:
    -   The `User` interface in `src/lib/types.ts` was updated to use `uid: string` instead of `id: string`.
    -   The `fetch` call in `src/app/(app)/admin/page.tsx` was confirmed to correctly use `user.uid`. This alignment fixed the `undefined` ID issue.

---

### 6. Incomplete return statement in `useToast` hook

-   **Symptom**: While not a visible bug yet, it would have prevented programmatic control of toasts (e.g., updating or dismissing a specific toast via code).
-   **Root Cause**: The `toast` function in `src/hooks/use-toast.ts` was only returning the `id` of the created toast, omitting the `dismiss` and `update` functions.
-   **Resolution**:
    -   The `return` statement in the `toast` function was completed to include `dismiss` and `update`, making the hook fully functional as intended: `return { id: id, dismiss, update }`.