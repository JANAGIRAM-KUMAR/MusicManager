# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Build backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
WORKDIR /app/backend
EXPOSE 6001
CMD ["npm", "start"]
