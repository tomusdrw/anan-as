# Use the official Node.js image based on Ubuntu
FROM node:20-bullseye-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application (if needed, adjust this step accordingly)
RUN npm run build

# Move typeberry out of node_modules to allow the fuzzer to collect coverage.
RUN cp -r ./node_modules/@typeberry/pvm-debugger-adapter typeberry
RUN npm link ./typeberry

# Start the application
CMD ["npm", "run", "fuzz"]
