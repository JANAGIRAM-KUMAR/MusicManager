# Agents Documentation

This file documents the key agents, scripts, and workflows for the Spotify clone project.

## Project Structure

The project has two main parts:

- **backend** (`backend/`) - Node.js/Express API server with MongoDB
- **frontend** (`frontend/`) - React + Vite + Tailwind CSS web interface

## Key Areas

### Backend (`backend/src/`)

- **controllers** - Route handlers for songs, albums, users, auth
- **models** - MongoDB schemas (User, Song, Album, Message)
- **routes** - Express route definitions
- **middleware** - Custom middleware (auth, file upload, etc.)
- **lib** - Utility libraries
- **seeds** - Database seeding scripts

### Frontend (`frontend/src/`)

- **components** - Reusable UI components (shadcn-ui based)
- **layout** - Page layout components
- **pages** - Page components
- **stores** - Zustand state management
- **providers** - React context providers (Clerk auth, etc.)
- **types** - TypeScript type definitions
- **lib** - Utility functions

## Available Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm start` | Start production server (`node src/server.js`) |
| `npm run dev` | Start dev server with nodemon |
| `npm run songs` | Seed songs database |
| `npm run albums` | Seed albums database |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build TypeScript + Vite build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Git Worktree Notes

The `.kilo/worktrees/momentous-canvas` directory contains a git worktree that can be used for isolated development. See `.kilo/` for more details.

## Common Patterns

- **Authentication**: Clerk for user management, Google OAuth integration
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Express-fileupload + Cloudinary
- **Real-time**: Socket.io for real-time features
- **Styling**: Tailwind CSS v4 with shadcn-ui components
- **State**: Zustand for client state, React Context for auth state

## Extending the Project

To add new features:

1. **Backend**: Add route in `backend/src/routes/`, controller in `backend/src/controllers/`, and model/schema as needed
2. **Frontend**: Add component in `frontend/src/components/`, page in `frontend/src/pages/`, and update stores/types as needed
3. **API**: Follow the existing REST pattern with JSON responses
4. **Testing**: Backend has no test script; frontend uses Vitest/Eslint