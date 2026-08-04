# Stage 1: Build the Vite/React application
FROM node:22-slim AS build
WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code and build for production
COPY . .
RUN npm run build

# Stage 2: Serve the compiled assets using NGINX
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for the browser UI
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]