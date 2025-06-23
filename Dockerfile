# Stage 1: Backend Builder
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install pnpm
RUN npm install -g pnpm

# Copy backend package files and install all dependencies (including dev for tsc)
COPY backend/package.json backend/pnpm-lock.yaml* ./
RUN if [ ! -f pnpm-lock.yaml ]; then touch pnpm-lock.yaml; fi
RUN pnpm install --frozen-lockfile

# Copy the rest of the backend code
COPY backend ./

# Compile TypeScript
RUN pnpm exec tsc

# Copy non-TS assets like sqlite.js and its data to the dist directory
RUN mkdir -p dist/database && \
    cp database/sqlite.js dist/database/sqlite.js && \
    cp -R database/data dist/database/data && \
    cp -R database/migrations dist/database/migrations


# Prune dev dependencies for smaller node_modules to copy to production
RUN pnpm prune --prod


# Stage 2: Frontend Builder
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN if [ ! -f pnpm-lock.yaml ]; then touch pnpm-lock.yaml; fi

# Install frontend dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the frontend code
COPY frontend ./

# Build frontend
RUN pnpm run build

# Stage 3: Production Image
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Install pnpm (needed if any pnpm commands were to be run, but not strictly necessary for 'node' CMD)
# RUN npm install -g pnpm # Can be removed if pnpm is not used in this stage

# Create backend directory
RUN mkdir -p backend

# Copy compiled backend code from backend-builder
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy production node_modules from backend-builder
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy necessary static assets and other JS files not compiled by tsc (like sqlite.js if it's pure JS)
# and also package.json for runtime access if needed (e.g. by some libraries)
COPY backend/package.json ./backend/package.json
COPY backend/database ./backend/database
COPY backend/views ./backend/views
COPY backend/assets ./backend/assets
# Ensure uploads directory structure exists if server tries to write to it, though content is ephemeral
RUN mkdir -p backend/uploads/logos


# Frontend
# Copy built frontend assets from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Expose port
EXPOSE 3001

# Set the command to start the backend server using the compiled server.js
CMD ["node", "backend/dist/server.js"]
