**Sri Lanka Institute of Information Technology**

Faculty of Computing

Department of Software Engineering

&nbsp;

&nbsp;

**SE3080: Software Project Management**

Year 3 Semester 2 – 2026

**Assignment 01: Mid-Project Agile Review**

Project: Wayble \- Inclusive Public Space Accessibility Mapper

**Group: Group\_050**

&nbsp;

| Student Registration Number | Student Name     | Email Address          |
| :-------------------------- | :--------------- | :--------------------- |
| IT23733794                  | Senadheera K.M.N | it23733794@my.sliit.lk |
| IT23713994                  | T.H.P Janith M   | it23713994@my.sliit.lk |
| IT23714298                  | A.P.P Lanka      | it23714298@my.sliit.lk |
| IT23752368                  | Aathika I.F.     | it23752368@my.sliit.lk |

#

#

[**1\. Project Selection and Justification 3**](#1.-project-selection-and-justification)

[Real World Relevance 3](#real-world-relevance)

[Agile Suitability 3](#agile-suitability)

[Scope Manageability 3](#scope-manageability)

[Team Collaboration 3](#team-collaboration)

[Version Control 4](#version-control)

[**2\. Project Charter (Product Vision) 4**](<#2.-project-charter-(product-vision)>)

[Product Vision Statement 4](#product-vision-statement)

[Scope 4](#scope)

[Objectives 4](#objectives)

[Constraints 4](#constraints)

[Stakeholder Roles 5](#stakeholder-roles)

[**3\. Initial Product Backlog 5**](#3.-initial-product-backlog)

[**4\. Sprint Backlogs and Plans 6**](#4.-sprint-backlogs-and-plans)

[Sprint 0 \- Initiation (28 Jul \- 2 Aug 2026\) 7](<#sprint-0---initiation-(28-jul---2-aug-2026)>)

[Sprint 1 (3 \- 14 August 2026\) 9](<#sprint-1-(3---14-august-2026)>)

[Sprint 2 (17 – 21 August 2026\) 11](<#sprint-2-(17-–-21-august-2026)>)

[**5\. Defined Scrum Roles 12**](#5.-defined-scrum-roles)

[Role Responsibilities 13](#role-responsibilities)

[**6\. Evidence of Scrum Events 13**](#6.-evidence-of-scrum-events)

[Sprint Planning 13](#sprint-planning)

[Weekly Sync Meetings (in place of daily stand-ups) 14](<#weekly-sync-meetings-(in-place-of-daily-stand-ups)>)

[Sprint Reviews 16](#sprint-reviews)

[Sprint Retrospectives 16](#sprint-retrospectives)

[7\. Working Increment Demo 17](#7.-working-increment-demo)

[**8\. Repository Link 17**](#8.-repository-link)

[**Appendix: Use of AI Tools (CLEAR Framework) 18**](<#appendix:-use-of-ai-tools-(clear-framework)>)

[CLEAR Framework Declaration 18](#clear-framework-declaration)

#

# 1\. Project Selection and Justification {#1.-project-selection-and-justification}

Wayble is a mobile application that helps people with disabilities, elderly citizens, and parents with strollers find, verify, and share accessibility information about public spaces cafes, offices, shops, and civic buildings before they travel there. The project addresses UN Sustainable Development Goal 10 (Reduced Inequalities) and SDG 11 (Sustainable Cities and Communities).

&nbsp;

The project was originally scoped and validated through user research conducted for the SE3050 (User Experience Engineering) module, and is carried forward as the shared software project for SE3080, per module guidance that both modules use the same project.

## Real World Relevance {#real-world-relevance}

Existing solutions Google Maps' accessibility layer, AccessNow ([https://map.accessnow.com](https://map.accessnow.com/)), and Wheelmap ([https://wheelmap.org](https://wheelmap.org)) offer only partial coverage in South Asia and rely on inconsistent, business-submitted, or sparse data. Wayble differentiates itself through community-driven, verifiable accessibility data. Four proxy stakeholders representing the primary user groups (a wheelchair user, a visually impaired commuter, an elderly citizen, and a café owner) were engaged during UX research and continue to inform sprint reviews as customer/stakeholder proxies.

## Agile Suitability {#agile-suitability}

The product breaks cleanly into independent, demoable increments: accessible-place search and filtering, screen-reader-first navigation, route and rest-point preview, business listing submission, and a community verification/trust layer each deliverable within a single sprint.

## Scope Manageability {#scope-manageability}

The app is built on Expo/React Native for the client and Convex (backend-as-a-service) for data, auth, storage, and geospatial queries, which avoids heavy infrastructure work and keeps the 4-sprint (\~8 week) timeline realistic for a 4-person student team.

## Team Collaboration {#team-collaboration}

Work is divided along clear technical lines backend/schema and geospatial logic, mobile UI, authentication, and testing/accessibility compliance with Scrum roles rotating across sprints. So each member experiences Product Owner, Scrum Master, and Development Team responsibilities. The team uses Clickup to manage the product backlog, sprint boards, task assignments, and burndown tracking.

## Version Control {#version-control}

A public Git repository has been maintained from Sprint 0 onward: [https://github.com/apLanka/Wayble](https://github.com/apLanka/Wayble), with commit history reflecting Sprint 0 \- 2 contributions.

# 2\. Project Charter (Product Vision) {#2.-project-charter-(product-vision)}

## Product Vision Statement {#product-vision-statement}

For people with disabilities, elderly citizens, and caregivers who struggle to know in advance whether a public space is genuinely accessible, Wayble is a mobile accessibility-mapping app that provides verified, community-driven accessibility data unlike Google Maps, AccessNow, or Wheelmap, which offer inconsistent or sparse coverage so that users can travel independently and with confidence.

## Scope {#scope}

In scope: map & filter search, location detail with verified accessibility features, screen-reader-first navigation, route/rest-point preview, business owner listing submission, community verification and issue-reporting, user authentication and accessibility-needs profiles.

Out of scope (for this timeframe): payment/monetization features, published App Store/Play Store release, multi-language support beyond English.

## Objectives {#objectives}

- Deliver a working, demoable increment at the end of every sprint.
- Achieve WCAG 2.1 AA-compliant screen-reader support for core flows.
- Establish a community verification model that both visitors and business owners can trust.

## Constraints {#constraints}

- 4 sprints (\~8 active development weeks); Sprint 0–2 covered in this assignment.
- 4-person team balancing coursework and freelance commitments weekly (not daily) sync meetings (see Section 6).
- Mobile-only client (Expo/React Native); backend-as-a-service (Convex) to minimize infrastructure overhead.

##

## Stakeholder Roles {#stakeholder-roles}

&nbsp;

| Stakeholder                           | Role                                                                                                                         |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Primary users                         | People with disabilities (mobility, visual, hearing impairments) represented by proxy persona Daniel Whitfield / Elena Novak |
| Secondary users                       | Elderly citizens, parents with strollers proxy persona Margaret O'Connor                                                     |
| Accessibility info providers          | Business owners proxy persona Marco Rossi                                                                                    |
| Data validators / policy stakeholders | Local government / municipal councils (future scope)                                                                         |
| Community partners                    | NGOs / disability advocacy groups (future scope)                                                                             |

&nbsp;

# 3\. Initial Product Backlog {#3.-initial-product-backlog}

The backlog is maintained in ClickUp (SE3080 – Wayble Project → Wayble Sprints), with every item tagged to an Epic, story-pointed, and prioritised. The table below summarises the items pulled into Sprint 0–2 by epic; individual task-level detail (owner, status, due date) is in Section 4\.

&nbsp;

| Epic Id | Epic                            | Description                                  |
| :------ | :------------------------------ | :------------------------------------------- |
| E1      | E1 Foundation & DevOps          | Repo, CI, environments, app shell            |
| E2      | Identity & Contributor Profiles | Accounts, contributor vs moderator roles     |
| E3      | Place Discovery & Map           | Find public spaces, see what's there         |
| E4      | Accessibility Reporting         | Community submits attribute data \+ evidence |
| E5      | Community Verification & Trust  | Confirm/dispute, confidence, freshness       |
| E6      | Personalised Needs Matching     | Filter/sort by the user's own access needs   |
| E7      | Moderation & Data Quality       | Queue, duplicates, abuse handling            |
| E8      | Accessibility of the App Itself | Screen reader, contrast, dynamic type        |

&nbsp;

# 4\. Sprint Backlogs and Plans {#4.-sprint-backlogs-and-plans}

The team follows a repeating sprint cycle plan, build, review, retrospect shown below.

&nbsp;

&nbsp;

**Wayble Sprint Cycle**

##

## Sprint 0 \- Initiation (28 Jul \- 2 Aug 2026\) {#sprint-0---initiation-(28-jul---2-aug-2026)}

Sprint Goal: Confirm project scope, form the team, and stand up the technical foundation. Tracked in ClickUp (SE3080 – Wayble Project → Wayble Sprints → Sprint 0: Initiation). All 6 tasks are Done 17 of 17 story points delivered.

&nbsp;

| Task                                                | Owner                           | Epic | Pts | Status |
| :-------------------------------------------------- | :------------------------------ | :--- | :-- | :----- |
| Confirm project selection and personas              | Aathika I.F.                    | E1   | 2   | Done   |
| Create GitHub repository and initialize             | T.H. Pasindu J.M.               | E1   | 2   | Done   |
| Scaffold Expo/React Native app and Convex project   | Senadheera K.M.N., A.P.P. Lanka | E1   | 5   | Done   |
| Draft Project Charter and Initial Product Backlog   | T.H. Pasindu J.M., Aathika I.F. | E1   | 3   | Done   |
| Assign initial Scrum roles and set up ClickUp board | A.P.P. Lanka                    | E1   | 2   | Done   |
| Initial market research to find the competition     | Senadheera K.M.N.               | E1   | 3   | Done   |

&nbsp;

**Total completed: 17 of 17 story points (6 of 6 tasks Done).**

## Sprint 1 (3 \- 14 August 2026\) {#sprint-1-(3---14-august-2026)}

Sprint Goal: Stand up the core data model, authentication, map integration, and accessible-place search infrastructure. Tracked in ClickUp (Sprint 1, 2/8 – 14/8). All 10 tasks are Done

&nbsp;

| Task                                                                 | Owner             | Epic | Pts | Status |
| :------------------------------------------------------------------- | :---------------- | :--- | :-- | :----- |
| WAY-1: convex/schema.ts users, places, reports, verifications, flags | A.P.P. Lanka      | E1   | 5   | Done   |
| WAY-2: ConvexReactClient/ConvexProvider setup in app layout          | T.H. Pasindu J.M. | E2   | 2   | Done   |
| WAY-3: Integrate mapbox-maps                                         | Senadheera K.M.N. | E3   | 2   | Done   |
| WAY-4: @convex-dev/geospatial queryNearest for nearby places         | Senadheera K.M.N. | E3   | 3   | Done   |
| WAY-5: Auth setup @convex-dev/auth, convex/auth.ts                   | A.P.P. Lanka      | E2   | 3   | Done   |
| WAY-6: updateProfile mutation for accessibilityNeeds                 | T.H. Pasindu J.M. | E2   | 2   | Done   |
| WAY-7: Seed initial places data (npx convex import)                  | Aathika I.F.      | E3   | 1   | Done   |
| WAY-8: searchIndex \+ filterKeys on places (accessibility)           | Senadheera K.M.N. | E3   | 2   | Done   |
| WAY-9: Image upload generateUploadUrl, expo-image-picker             | T.H. Pasindu J.M. | E4   | 3   | Done   |
| WAY-10: Type-checking & unit tests (tsc \--noEmit, convex-test)      | Aathika I.F.      | E8   | 2   | Done   |

&nbsp;

**Total completed: 25 of 25 story points**

##

##

## Sprint 2 (17 – 21 August 2026\) {#sprint-2-(17-–-21-august-2026)}

This sprint was compressed to one week (instead of the usual two) to leave time for demo preparation and report finalisation ahead of the 25 August submission deadline.

&nbsp;

Sprint Goal: Ship the accessible map-search experience end-to-end live map/list search, accessibility-attribute display, the user's accessibility-needs profile, a full screen-reader pass, filtering, and nearby-place push notifications. Tracked in ClickUp (Sprint 2, 17/8 – 21/8). All 6 tasks are Done&nbsp;

&nbsp;

| Task                                                        | Owner             | Epic | Pts | Status |
| :---------------------------------------------------------- | :---------------- | :--- | :-- | :----- |
| WAY-11: See public spaces near me on a map                  | Senadheera K.M.N. | E3   | 8   | Done   |
| WAY-12: View a place's recorded accessibility attributes    | Aathika I.F.      | E3   | 5   | Done   |
| WAY-13: Set my accessibility needs in my profile            | T.H. Pasindu J.M. | E2   | 3   | Done   |
| WAY-14: Screen-reader pass over all Sprint 1 screens        | A.P.P. Lanka      | E8   | 3   | Done   |
| WAY-15: Search and filter places by accessibility attribute | Senadheera K.M.N. | E3   | 8   | Done   |
| WAY-16: Push notification verify a place near you           | T.H. Pasindu J.M. | E5   | 5   | Done   |

&nbsp;

**Total completed: 32 of 32 story points**

&nbsp;

# 5\. Defined Scrum Roles {#5.-defined-scrum-roles}

Roles rotated across sprints so every member experienced each Scrum responsibility, per the assignment's Team Collaboration guideline.

&nbsp;

| Sprint       | Product Owner     | Scrum Master      | Development Team                                                 |
| :----------- | :---------------- | :---------------- | :--------------------------------------------------------------- |
| Sprint 0 & 1 | T.H. Pasindu J.M. | Senadheera K.M.N. | Senadheera K.M.N., T.H. Pasindu J.M., A.P.P. Lanka, Aathika I.F. |
| Sprint 2     | Aathika I.F.      | A.P.P. Lanka      | Senadheera K.M.N., T.H. Pasindu J.M., A.P.P. Lanka, Aathika I.F. |

##

## Role Responsibilities {#role-responsibilities}

- Product Owner: owns and prioritizes the backlog, represents the stakeholder/persona voice in sprint planning and review, accepts or rejects completed increments.
- Scrum Master: facilitates sprint planning, weekly sync meetings, and retrospectives; removes blockers; keeps the board and burndown up to date.
- Development Team: designs, builds, and tests the backlog items assigned each sprint (schema, mobile UI, auth, geospatial logic, accessibility compliance).

# 6\. Evidence of Scrum Events {#6.-evidence-of-scrum-events}

The team holds a single weekly sprint-sync meeting (combining planning check-in and stand-up) rather than daily stand-ups. This was a deliberate team decision given that all four members are balancing coursework, freelance work, and other module deadlines in parallel a weekly cadence was judged more sustainable than daily check-ins without sacrificing visibility, since progress is also tracked continuously via the ClickUp Sprint Folder (SE3080 – Wayble Project → Wayble Sprints) and GitHub commit history between meetings.

&nbsp;

ClickUp Space: [https://app.clickup.com/90182961119/v/l/f/901815985490](https://app.clickup.com/90182961119/v/l/f/901815985490)

&nbsp;

Every task moves through a fixed workflow in ClickUp, shown below, which is how sprint progress is tracked between weekly syncs.

&nbsp;

**Clickup Task Status workflow**

&nbsp;

![][image1]

## Sprint Planning {#sprint-planning}

Sprint 0 Planning (on/around 28 Jul 2026): Team set up the ClickUp Space and Wayble Sprints folder, and defined the 6 initiation tasks persona/project confirmation, GitHub repo, the Convex/Expo scaffold, the project charter and initial backlog, Scrum role assignment, and initial market research totalling 17 story points.

&nbsp;

Sprint 1 Planning (on/around 3 Aug 2026): Team reviewed the product backlog and selected the 10 items listed in Section 4 for Sprint 1 (WAY-1 to WAY-10) the core data schema, auth, map integration, geospatial search, seed data, and initial testing totalling 25 story points. Estimated together using planning poker-style discussion.

&nbsp;

Sprint 2 Planning (on/around 17 Aug 2026): Team selected 6 items (WAY-11 to WAY-16) to ship the end-to-end accessible-search experience map/list search, accessibility-attribute display, the accessibility-needs profile, a full screen-reader pass, filtering, and push notifications totalling 32 story points, for the compressed one-week Sprint 2\.

## Weekly Sync Meetings (in place of daily stand-ups) {#weekly-sync-meetings-(in-place-of-daily-stand-ups)}

**Week 1 \- w/c 3 Aug 2026 (Sprint 1\)**

- Attendees: All 4 members.
- Discussed: GitHub repo setup, the Expo/React Native \+ Convex project scaffold, and drafting the project charter and initial backlog. Agreed on Scrum roles and set up the ClickUp Space and Sprint 0 board.
- Decisions: Split setup work repo to T.H. Pasindu J.M., app scaffold jointly to Senadheera K.M.N. and A.P.P. Lanka, charter/backlog and persona confirmation to Aathika I.F. (–with Pasindu), Scrum role/board setup to A.P.P. Lanka, and market research to Senadheera K.M.N.
- Blockers: None significant first-time setup friction with the Expo/Convex toolchain, resolved within the sprint.
- Next steps: Move into Sprint 1 with the core data schema, auth, and map integration as the first technical increment.  
  &nbsp;

**Week 2 \- w/c 10 Aug 2026 (Sprint 1\)**

- Attendees: All 4 members.
- Discussed: The convex/schema.ts design (WAY-1: users, places, reports, verifications, flags tables) before implementation started, to agree on field names and relationships. Confirmed the ConvexReactClient/ConvexProvider wiring (WAY-2) and the switch to Mapbox for map integration (WAY-3).
- Decisions: Built the geospatial nearby-search (WAY-4) and auth setup (WAY-5) in parallel since they don't depend on each other.
- Blockers: Initial unfamiliarity with @convex-dev/geospatial's index configuration resolved by consulting the package docs.
- Next steps: Move on to the updateProfile mutation (WAY-6), seed data (WAY-7), search/filter keys (WAY-8), image upload (WAY-9), and testing (WAY-10) to close out Sprint 1\.  
  &nbsp;

**Week 3 \- w/c 17 Aug 2026 (Sprint 2, compressed one-week sprint)**

- Attendees: All 4 members.
- Discussed: Building the user-facing map/list search (WAY-11) and accessibility-attribute display (WAY-12) on top of Sprint 1's backend, alongside the accessibility-needs profile screen (WAY-13), a full screen-reader pass (WAY-14), search/filter UI (WAY-15), and push notifications for nearby verified places (WAY-16).
- Decisions: Given the compressed one-week timebox, front-loaded the map search and attribute display (the largest items, 8 pts each) early in the week so screen-reader testing (WAY-14) had a stable UI to test against.
- Blockers: Tight timeline for the screen-reader pass mitigated by testing incrementally across iOS and Android throughout the week rather than leaving it to the end.
- Next steps: Finalise all 6 items, prepare the Sprint 2 Review demo, and move into report/presentation preparation for submission.

## Sprint Reviews {#sprint-reviews}

Sprint 0 Review: Team confirmed the technical foundation (repo, Expo/Convex scaffold) and got sign-off on the project charter and personas from proxy stakeholders (Daniel, Elena, Margaret, Marco established in SE3050 research).

&nbsp;

Sprint 1 Review: The team demonstrated the working data model, authentication, Mapbox integration, and geospatial nearby-place query to the proxy stakeholders.&nbsp;

&nbsp;

Sprint 2 Review: The team demonstrated the full accessible-search experience live map/list search, accessibility-attribute display, the accessibility-needs profile, screen-reader navigation, filtering, and nearby-place push notifications.&nbsp;

## Sprint Retrospectives {#sprint-retrospectives}

| Sprint   | What went well                                                                                                                                                                                                                        | What to improve                                                                                                                                                           | Action for next sprint                                                                                        |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------ |
| Sprint 0 | Repo setup, the Convex/Expo scaffold, and the project charter came together quickly once roles were split by strength. Client discovery and charter sign-off gave the team a clear shared reference point going into Sprint 1\.       | Nothing major this was a smooth setup sprint, delivered at 100% of planned points.                                                                                        | Carry the same "agree on shape before building" approach into Sprint 1's feature work.                        |
| Sprint 1 | The schema (WAY-1) and auth setup (WAY-5) landed early, giving the rest of the team a stable base to build against. All 10 items were completed, including the switch to Mapbox for map integration.                                  | The @convex-dev/geospatial integration took longer than expected since nobody on the team had used it before.                                                             | Timebox unfamiliar-library spikes to a fixed 1–2 hours before committing to a story-point estimate.           |
| Sprint 2 | All 6 items shipped in a compressed one-week sprint, including the two largest items (map search and filtering, 8 pts each) front-loading them early in the week gave the screen-reader testing (WAY-14) a stable UI to work against. | The one-week timebox left little slack screen-reader testing across both iOS and Android had to happen incrementally throughout the week rather than as a dedicated pass. | For future compressed sprints, scope 1 fewer item so there's buffer for cross-platform accessibility testing. |

&nbsp;

# 7\. Working Increment Demo {#7.-working-increment-demo}

By the end of Sprint 2, the following features are functional and demoable on device/simulator:

- By the end of Sprint 2, the following features are functional and demoable on device/simulator all items below are marked Done in ClickUp:
- Live map and list search of nearby public spaces, powered by Mapbox and Convex geospatial queries.
- Location detail screen showing each place's recorded accessibility attributes.
- Editable accessibility-needs profile (accessibilityNeeds).
- Search and filtering of places by accessibility attribute.
- A full screen-reader pass across all Sprint 1 screens (iOS and Android).
- Push notification when a verified accessible place is nearby.
- Underlying data model, authentication, and seeded real-place data supporting all of the above.

&nbsp;

Demo: [Link](https://drive.google.com/file/d/1nRpUqhYn8XSxGbhJRhVoChFmNx0NLyzD/view)

# 8\. Repository Link {#8.-repository-link}

Git repository: [https://github.com/apLanka/Wayble](https://github.com/apLanka/Wayble)

&nbsp;

The repository has been maintained from Sprint 0 onward, with commit history covering Sprint 0–2 work across the data schema, authentication, Mapbox/geospatial integration, and the accessible-search UI. Each member's individual commits should be visible in the contribution graph and used as evidence of individual contribution at the viva.

&nbsp;

Project management tool: Clickup \- [https://app.clickup.com/90182961119/v/l/f/901815985490](https://app.clickup.com/90182961119/v/l/f/901815985490)

&nbsp;The backlog, sprint folders (Sprint 0: Initiation, Sprint 1, Sprint 2), task ownership, story points, and status data referenced in Sections 3–4 are maintained there; include screenshots of the Backlog and all three sprint folders as supporting evidence in your final submission.

#

# Appendix: Use of AI Tools (CLEAR Framework) {#appendix:-use-of-ai-tools-(clear-framework)}

Generative AI tools were used as learning aids during this assignment, in line with the module's permitted use policy.

&nbsp;

| Tool        | How it was used                                                                                                                                                                                                                                                                                                                                         |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Antigravity | Used as an agentic coding assistant for scaffolding larger, multi-file pieces of work in the Convex backend e.g. generating the initial shape of the schema.ts table definitions (WAY-1) and the geospatial nearby-search query (WAY-4) from a plain-language description of the requirement, which the team then reviewed and adjusted field-by-field. |
| Claude Code | Used for debugging (e.g. issues encountered while wiring the Mapbox integration, WAY-3, and the accessibility-needs profile mutation, WAY-6/WAY-13), and for structuring and drafting this report from the team's ClickUp data and sprint history.                                                                                                      |
| Cursor      | Used as the primary in-editor assistant for day-to-day development inline code completion, small refactors, and explaining unfamiliar parts of the Expo/React Native and Convex APIs while implementing map search (WAY11) and the screen-reader pass (WAY-14).                                                                                         |

## CLEAR Framework Declaration {#clear-framework-declaration}

- Collaborate: AI tools were used as coding/learning assistants alongside our own design decisions, not as a replacement for the team's own work.
- Learn: All AI-suggested code and content was reviewed by the team member responsible for that area before being merged.
- Evaluate: AI-generated code was tested (tsc \--noEmit, convex-test) and manually verified against the acceptance criteria in the user stories before being accepted.
- Acknowledge: This appendix declares all significant AI tool use across Sprint 0 \- 2\.
- Reflect: Each member should be prepared to explain, at the viva, which parts of their contribution were AI-assisted and what they personally understood, changed, or verified.

&nbsp;

[image1]: data:image/png;base64,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
