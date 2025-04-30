# PROJECT_CONTEXT.md

## Git Snapshot
Reference commit: 8c4a3b7 "Semi-stable baseline: global overlays, robust dashboard/loop detail animation, secure auth, and UI/UX polish"

This commit represents a key milestone in the Loopz development, establishing a semi-stable baseline with the following features:
- Global overlay system for UI layers
- Robust dashboard and loop detail animations
- Secure authentication
- Comprehensive UI/UX polish

## Project Vision
Loopz is a mindfulness application designed to help users untangle their thoughts and find mental clarity through an AI-powered conversation interface. The core concept centers around capturing thoughts and tasks in "loops" that users can track, refine, and complete over time. Based on the codebase and project structure, Loopz aims to combine conversational AI with productivity tools in a unique user experience that helps people organize their thoughts and reduce mental clutter.

The name "Loopz" appears to reference both the concept of completing feedback loops in thoughts/actions and the idea of "closing loops" in one's mind - resolving open questions or concerns that occupy mental bandwidth.

## User Experience Philosophy
The application follows several core UX principles evident throughout the codebase:

1. **Conversational Interface**: Interaction primarily happens through natural conversation with an AI assistant called "Oracle," making the experience feel more human and approachable.

2. **Layered Design**: The UI is structured in layers (zen/landing, dashboard, detail) that slide in and out, creating a spatial experience rather than traditional page navigation.

3. **Thoughtful Animation**: Smooth transitions between states create a sense of flow and continuity using Framer Motion animations that enhance rather than distract from the experience.

4. **Minimalist Design**: The interface employs a clean, monochromatic aesthetic with ample white space, reducing cognitive load and creating a sense of calm that aligns with the mindfulness focus.

5. **Progressive Disclosure**: Complex functionality is revealed gradually as users need it, maintaining simplicity while providing depth when required.

6. **Guided Pathways**: The AI provides suggestions for creating loops based on conversation, gently guiding users toward structure without forcing it.

## Technical Architecture

### Core Stack
- **Frontend**: Next.js (App Router) with TypeScript and React
- **Styling**: Tailwind CSS with Framer Motion for animations
- **Backend**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI API (GPT-4) for conversation processing

### Key Architectural Patterns
1. **Client-Side Components**: React components with 'use client' directive for interactive elements
2. **Server-Side API Routes**: Next.js API routes for server operations (AI processing, database operations)
3. **Context Providers**: React Context API for global state management
4. **Real-time Subscriptions**: Supabase real-time channels for live updates
5. **Optimistic UI Updates**: State updates before confirming database changes to create responsive feel

## Component Structure

### Core Components
1. **Dashboard.tsx** (Needs refactoring):
   - Currently a monolithic component that handles:
     - Chat UI and message handling
     - Loop suggestion and creation
     - Loop list display and navigation
     - Animation states for transitions
   - Primary candidate for refactoring due to its complexity

2. **LoopDetail.tsx**:
   - Displays and manages individual loop details
   - Handles task CRUD operations
   - Manages real-time updates via Supabase subscriptions

3. **LoopzList.tsx** and **LoopzItem.tsx**:
   - Handle the display and interaction of loop items
   - Manage animations and progress visualization

4. **ChatInput.tsx**:
   - Manages user input for the conversational interface
   - Handles sending messages to the AI service

5. **DashboardContext.tsx**:
   - Manages global dashboard visibility state
   - Controls UI layer transitions

6. **SupabaseProvider.tsx**:
   - Manages authentication state
   - Provides Supabase client instance to components

7. **useAI.ts**:
   - Custom hook for AI processing
   - Handles API calls to the Oracle endpoint

### UI Architecture Issues
- The Dashboard component has grown into a monolith that handles too many concerns
- State management is spread across component state and context providers
- Animation logic is tightly coupled with business logic
- Z-index management across layered components is complex

## State Management

### Current Approach
1. **React Context**: Used for global states (auth, dashboard visibility)
2. **Component State**: Local state managed with useState hooks
3. **Derived State**: Computed values based on component state
4. **Real-time Data**: Supabase subscriptions update local state when database changes

### Data Flow
1. User interactions trigger local state changes
2. State changes may trigger API calls (to Supabase or AI endpoint)
3. API responses update local state
4. Real-time subscriptions provide additional updates from database changes

### Pain Points
- Complex state interdependencies in the Dashboard component
- Overlapping responsibilities between global and local state
- Lack of centralized state management for complex operations
- Challenge of coordinating animations with state transitions

## Data Model

### Core Entities
1. **User**:
   - Managed by Supabase Auth
   - Associated with loops and steps

2. **Loopz**:
   - Represents a collection of thoughts and tasks
   - Contains: id, title, progress, totalSteps, completedSteps, timestamps

3. **Step**:
   - Individual tasks within a loop
   - Contains: id, loopz_id, content, is_completed, order_num

4. **Message**:
   - Chat messages between user and AI
   - Contains: id, content, isAI, timestamp

### Database Schema
The application uses Supabase (PostgreSQL) with the following tables:
- `auth.users` - Managed by Supabase Auth
- `public.loopz` - Stores loop records with RLS policies
- `public.steps` - Stores task steps with RLS policies

## UI/UX Approach

### Interface Layers
1. **Zen/Landing Layer**: Initial state, focused on sign-in and minimal UI
2. **Dashboard Layer**: Slide-in panel showing loops and chat interface
3. **Detail Layer**: Full-screen view of a specific loop and its tasks

### Animation Patterns
1. **Slide Transitions**: Horizontal slide animations for layer transitions
2. **Expand/Collapse**: For chat interface and other collapsible elements
3. **Fade Animations**: For subtle element transitions
4. **Loading States**: Spinner animations for async operations
5. **Progress Indicators**: Visual feedback for loop completion

### Design Principles
1. **Clean Typography**: Simple, readable text hierarchy
2. **Whitespace**: Generous spacing to create calm visual experience
3. **Subtle Colors**: Primarily monochromatic with minimal accent colors
4. **Focused Interactions**: Clear affordances for interactive elements
5. **Consistent Patterns**: Uniform interaction patterns throughout the app

## Development Principles

### Coding Standards (from CLAUDE.md)
1. **TypeScript**: Use strict mode with explicit typing
2. **Imports**: Order - React hooks, external libraries, then local imports
3. **Components**: Use functional components with explicit typing
4. **Naming Conventions**:
   - camelCase for variables, functions, props
   - PascalCase for components, interfaces, types
   - snake_case for database fields
   - Boolean variables: prefix with `is`/`has`
   - Event handlers: prefix with `handle`/`on`
5. **Styling**: Tailwind CSS for styling
6. **State Management**: React hooks and Context API
7. **Error Handling**: Try/catch with consistent error messages
8. **File Structure**: Group by feature in app directory
9. **Animations**: Use Framer Motion for animations
10. **Form Handling**: Consistent handling with validation

### Performance Considerations
1. **Optimistic UI Updates**: Update UI before confirming database changes
2. **Real-time Subscriptions**: Efficient real-time updates for collaborative features
3. **Animation Performance**: Using hardware-accelerated animations via Framer Motion
4. **API Efficiency**: Structured API calls to minimize roundtrips

## Technical Challenges

### Current Pain Points
1. **Dashboard Component Complexity**: The Dashboard.tsx component has grown unwieldy and needs refactoring
2. **Animation Coordination**: Synchronizing animations with state changes is challenging
3. **Z-index Management**: Proper layering of UI components requires careful z-index management
4. **State Coordination**: Managing interrelated state across components and contexts
5. **Optimistic UI Edge Cases**: Handling failures in optimistic UI updates

### Architectural Challenges
1. **Layer Management**: Coordinating the three main UI layers (zen, dashboard, detail)
2. **Real-time Updates**: Ensuring consistent state with real-time database changes
3. **AI Integration**: Structuring AI responses for consistent UI rendering
4. **Mobile Experience**: Ensuring smooth animations and interactions on mobile devices

## Refactoring Priorities

### Dashboard.tsx Refactoring
The Dashboard component should be decomposed into smaller, focused components:

```typescript
// Proposed structure
- Dashboard (container)
  - DashboardHeader
  - LoopzList
    - LoopzItem
  - ChatInterface
    - ChatMessages
    - ChatInput
    - LoopzSuggestion
```

### Implementation Strategy
1. **Extract Chat Components**: Separate chat UI and logic into dedicated components
2. **Extract Loop List**: Move loop listing functionality to dedicated component
3. **State Management**: Consider moving more state to context providers
4. **Animation Logic**: Abstract animation patterns into custom hooks
5. **Event Handling**: Simplify event propagation between components

## Future Roadmap
Based on the codebase structure and context folder file names, planned features and improvements likely include:

1. **Enhanced AI Capabilities**: More personalized and context-aware AI responses
2. **Progress Visualization**: Better visualization of loop completion and progress
3. **Sharing Capabilities**: Ability to share loops with others for collaboration
4. **Integration Options**: Connecting with calendar, task management systems
5. **Offline Support**: Robust offline functionality for mobile use
6. **Notification System**: Smart reminders for loop progress
7. **Analytics Dashboard**: Insights into thought patterns and progress

## Key Insights from Historical Development
Based on context folder naming, Loopz has undergone several phases:
1. **Original MVP**: Basic concept implementation
2. **Blueprint and Master Plan**: Strategic planning documents
3. **Founder Blueprint**: Vision and direction
4. **Reboot Blueprint**: Reimagined direction or major refactoring
5. **Current Semi-stable Baseline**: Core functionality working but requiring refinement

The current implementation represents a "semi-stable baseline" with the core functionality working but requiring refinement, particularly around component structure and state management.

## Developer Onboarding Checklist

For new team members joining the project:

1. **Environment Setup**:
   - Clone repository and install dependencies
   - Set up Supabase access and API keys
   - Configure OpenAI API access
   - Run database setup script

2. **Architecture Familiarization**:
   - Review core components: Dashboard, LoopDetail, Context providers
   - Understand the three-layer UI architecture
   - Review auth flow and Supabase integration

3. **Development Workflow**:
   - Run development server with `npm run dev`
   - Test database with `npm run db:test`
   - Verify API routes functionality

4. **Coding Standards**:
   - Follow TypeScript standards with explicit typing
   - Use functional components with hooks
   - Follow Tailwind CSS naming conventions
   - Adhere to file structure organization
   - Review CLAUDE.md for detailed coding guidelines

5. **Current Focus Areas**:
   - Dashboard component refactoring
   - Improving animation performance
   - Enhancing real-time update reliability
   - Mobile experience optimization

6. **Suggested First Tasks**:
   - Extract a small component from Dashboard.tsx
   - Add improved error handling for API calls
   - Create or update TypeScript interfaces for consistency
   - Optimize animations for smoother transitions