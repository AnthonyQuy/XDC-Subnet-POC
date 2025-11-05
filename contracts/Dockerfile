FROM node:16-alpine

# Install dependencies
RUN apk add --no-cache bash git python3 make g++ curl ca-certificates

# Install Solidity compiler
RUN curl -L https://github.com/ethereum/solidity/releases/download/v0.8.19/solc-static-linux -o /usr/local/bin/solc \
    && chmod +x /usr/local/bin/solc

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install global tools
RUN npm install -g truffle@5.8.0 ganache@7.9.1

# Create necessary directories
RUN mkdir -p /app/source /app/compiled /app/deployed

# Set volume mount points
VOLUME ["/app/source", "/app/compiled", "/app/deployed"]

# Default command
CMD ["/bin/bash"]
