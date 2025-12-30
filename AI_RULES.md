# AI Rules and Tech Stack Guidelines

This document outlines the core technologies and best practices for developing and maintaining the JetSuite application, with a focus on AI integration.

---

## 🚀 Tech Stack Overview

JetSuite is built on a modern, efficient, and scalable web stack designed for rapid development and high performance.

*   **Frontend Framework:** React (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (pre-built components)
*   **Icons:** Lucide React
*   **Backend-as-a-Service (BaaS):** Supabase (Database, Authentication, Storage, Edge Functions)
*   **AI Capabilities:** Google Gemini API (`@google/genai`)
*   **Payment Processing:** Stripe
*   **Deployment:** Vercel
*   **Routing:** Custom client-side routing managed within `App.tsx`

---

## 📚 Library Usage Rules

To maintain consistency, readability, and efficiency, please adhere to the following guidelines when choosing libraries and tools for specific functionalities:

*   **AI Interactions:**
    *   **Library:** `@google/genai`
    *   **Usage:** All AI-powered features, including text generation (e.g., `JetContent`, `JetPost`), image generation (`JetImage`, `JetCreate`), and structured data analysis (`JetBiz`, `JetViz`, `JetCompete`, `JetKeywords`, `JetReply`).
    *   **API Key:** Always use `process.env.GEMINI_API_KEY` (or `process.env.API_KEY` in `jethelper` context) for API authentication.

*   **UI Components:**
    *   **Library:** `shadcn/ui`
    *   **Usage:** Prioritize using existing shadcn/ui components for common UI elements (buttons, cards, forms, dialogs, etc.).
    *   **Custom Components:** If a specific component is not available in shadcn/ui, create a new, small, and focused React component in `src/components/` and style it exclusively with Tailwind CSS.

*   **Styling:**
    *   **Library:** Tailwind CSS
    *   **Usage:** All styling must be done using Tailwind CSS utility classes. Avoid inline styles or custom CSS files unless absolutely necessary for complex animations or global resets.
    *   **Responsive Design:** Always ensure designs are responsive using Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`).

*   **Icons:**
    *   **Library:** `lucide-react`
    *   **Usage:** Use icons from the `lucide-react` library for all visual iconography.

*   **Backend, Database, and Authentication:**
    *   **Platform:** Supabase (`@supabase/supabase-js`)
    *   **Usage:** Supabase is the sole backend provider for database operations, user authentication, and serverless functions (via Vercel API routes).
    *   **Security:** Always use the `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that require bypassing Row Level Security (RLS) or elevated privileges. Never expose this key client-side.

*   **Payment Processing:**
    *   **Platform:** Stripe (`stripe`)
    *   **Usage:** All billing, subscription management, and customer portal interactions are handled through Stripe.
    *   **API Endpoints:** Interact with Stripe via dedicated Vercel API routes (e.g., `/api/stripe/create-checkout-session`). Never directly expose Stripe secret keys client-side.

*   **Routing:**
    *   **Implementation:** Custom client-side routing using `useState` and `window.history.pushState` within `App.tsx`.
    *   **Guideline:** Do not introduce `react-router-dom` or other routing libraries unless a major refactor is explicitly requested. Maintain the existing routing pattern.

*   **HTTP Requests:**
    *   **API:** Native `fetch` API
    *   **Usage:** Use the browser's native `fetch` API for all HTTP requests to backend API routes. Avoid third-party HTTP client libraries unless a specific need arises.

*   **Date and Time Handling:**
    *   **Utility:** `src/utils/dateTimeUtils.ts`
    *   **Usage:** Always use the helper functions provided in `dateTimeUtils.ts` for consistent date formatting, calculations, and timezone considerations.

---

## 💡 General AI Development Principles

*   **Contextual Awareness:** AI models should leverage available user and business profile data (e.g., `Business DNA`) to generate highly personalized and relevant outputs.
*   **Error Handling:** Implement robust error handling for all AI API calls. Provide clear, user-friendly feedback when AI generation fails or encounters issues.
*   **Transparency:** Clearly indicate when content is AI-generated and provide options for refinement or regeneration.
*   **Safety:** Ensure AI prompts and responses adhere to ethical guidelines and avoid generating harmful, biased, or inappropriate content.
*   **Efficiency:** Optimize AI prompts for concise and accurate responses to minimize token usage and improve response times.