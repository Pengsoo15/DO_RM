
## Student Survival OS – Development & Deployment Strategy

---

# 1. Main Development Philosophy

The project should prioritize:

- Simple and understandable code
- Stable functionality
- Human-like coding structure
- Easy debugging
- Realistic frontend architecture
- Clean deployment setup

The goal is NOT:
- Overengineering
- Complex frameworks
- AI-looking/generated code patterns

The goal IS:
> A clean, realistic student-built project that works properly and is easy to explain.

---

# 2. Code Style Strategy (Avoiding Obvious AI-Generated Code)

## A. Avoid Overly Perfect Structures

Do NOT:
- Create unnecessarily complex abstractions
- Use excessive helper functions
- Over-modularize small logic

Keep logic:
- direct
- readable
- practical

---

## B. Use Natural Variable Naming

Avoid AI-looking names like:
```javascript
calculateOptimizedBudgetAllocation()
Prefer:

updateBudget()
getDailyLimit()
saveData()
C. Write Logic Like a Student Developer

Good:

if (spentToday > dailyLimit) {
  remainingBudget -= spentToday;
}

Avoid:

const adjustedRemainingBudget = (() => {
   ...
})();
D. Avoid Overcommenting

Do NOT comment every line.

Bad:

// This function saves data
function saveData() {}

Use comments only when:

logic is important
calculations are not obvious
E. Keep Folder Structure Realistic

Avoid enterprise-level structure.

Good:

/js
  app.js
  tracker.js
  advice.js
  storage.js

Avoid:

/src/core/engines/services/managers/
3. Backend Strategy (Simple but Realistic)

Since this is a prototype:

Backend Choice
Minimal backend only if necessary
Prefer frontend-first architecture

Possible backend use:

API key protection
AI requests
Future expansion
Recommended Backend
Node.js + Express

Simple structure:

/server
  server.js
  routes/
  utils/

Keep backend:

lightweight
readable
small
4. API Key Security Plan
NEVER:
Put API keys directly inside frontend JS
Push secrets to GitHub
Correct Method
Use .env

Example:

OPENAI_API_KEY=your_key_here
Access in backend only

Example:

const apiKey = process.env.OPENAI_API_KEY;
Add .env to .gitignore
.env
node_modules
5. GitHub Deployment Preparation
Repository Setup

Structure:

/student-survival-os
Important Files
.gitignore

Include:

node_modules
.env
README.md

Should include:

project overview
features
installation
deployment steps
Commit Style

Avoid AI-looking commits like:

Implemented sophisticated financial recalculation algorithm

Use natural commits:

fixed tracker bug
added food advice
updated dashboard
6. Vercel Deployment Strategy
Frontend Deployment

Deploy:

HTML
CSS
JS frontend
Backend Deployment (Optional)

If backend exists:

deploy Express API separately
use environment variables in Vercel dashboard
Important Checks Before Deploy
Remove console spam
Check broken paths
Verify LocalStorage works
Test mobile responsiveness
Check page refresh behavior
7. Error Prevention Plan
A. Frequent Testing

Test after every feature:

tracker
budget update
advice generation
add money system

Do NOT wait until everything is finished.

B. Common Errors to Check
LocalStorage
null values
corrupted JSON

Example:

const data = JSON.parse(localStorage.getItem("budget")) || {};
Input Validation

Prevent:

negative numbers
empty values
NaN issues

Example:

if (!amount || amount < 0) return;
DOM Errors

Check if element exists:

const budgetText = document.getElementById("budget");

if (budgetText) {
  budgetText.textContent = value;
}
8. Human-Like Frontend Development Strategy
A. Avoid Excessive Animations

Keep UI:

smooth
simple
realistic
B. Prioritize Usability

Focus on:

readability
spacing
clear labels
responsive layout
C. Use Realistic UI Text

Avoid robotic AI messages.

Bad:

“Financial optimization complete.”

Good:

“Your budget is getting tight this week. Try reducing snack spending.”

9. AI Advice System Strategy

The AI should:

sound natural
be short and direct
avoid sounding like ChatGPT
Good Example

“You’re still within a safe budget range, but transport spending is increasing faster than expected.”

Avoid

“Based on comprehensive analysis of your spending behaviors…”

10. Performance Strategy

Keep system lightweight.

Avoid:

heavy libraries
unnecessary APIs
complex frameworks

Target:

fast loading
minimal dependencies
smooth mobile experience
11. Final Development Goal

The project should feel like:

A polished and intelligent student-built financial survival system

NOT:

an AI-generated demo
an overengineered startup clone
a template project
12. Final Checklist Before Submission
Functionality
Tracker works
Add money updates correctly
Daily limit recalculates
Advice updates dynamically
Food plans generate properly
Security
API keys hidden
.env ignored
No secrets in GitHub
Deployment
GitHub repository clean
Vercel deployment working
Mobile responsive
Presentation Readiness
Simple explanation
Clean UI
Stable demo flow
No major bugs
end of plan