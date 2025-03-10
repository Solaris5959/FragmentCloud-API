####################################
##----- Install Dependencies -----##
####################################

FROM node:20.11.1-bullseye-slim AS dependencies

# Set environment variables for production optimizations
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package*.json ./

# Install only production dependencies deterministically
RUN npm ci --only=production

####################################
##--- Build/Deploy Application ---##
####################################

FROM node:20.11.1-bullseye-slim AS build

LABEL maintainer="Connor McDonald <cmcdonald30@myseneca.com>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Install dumb-init globally in the final stage
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init=1.2.5-1 && \
    rm -rf /var/lib/apt/lists/*

# Use /app as our working directory
WORKDIR /app

# Copy installed dependencies from the dependencies stage
COPY --from=dependencies /app \/app

# Copy application source code with correct ownership
COPY --chown=node:node ./src ./src

# Copy the HTPASSWD file for basic authentication
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

# Use a non-root user for security
USER node

# Expose the application port
EXPOSE ${PORT}

# Use dumb-init to properly handle process signals
CMD ["dumb-init", "--", "node", "src/server.js"]
