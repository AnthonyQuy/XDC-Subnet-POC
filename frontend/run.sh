#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Handle stop command
if [[ "$1" == "stop" ]]; then
  echo -e "${YELLOW}Stopping XDC Network Manager Frontend Docker containers...${NC}"
  docker compose -p xdc down
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Frontend Docker containers stopped successfully.${NC}"
  else
    echo -e "${RED}Failed to stop containers. Check Docker logs for more information.${NC}"
    exit 1
  fi
  exit 0
fi

echo -e "${YELLOW}Starting XDC Network Manager Frontend Development Environment${NC}"
echo "-----------------------------------------------------------------"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if docker_net exists, create if not
echo -e "${YELLOW}Checking if docker_net network exists...${NC}"
if ! docker network inspect docker_net > /dev/null 2>&1; then
  echo -e "${YELLOW}Creating docker_net network...${NC}"
  docker network create --subnet=192.168.25.0/24 --driver=bridge docker_net
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create docker_net network. Please check your Docker permissions.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Network created successfully.${NC}"
else
  echo -e "${GREEN}docker_net network already exists.${NC}"
fi

# Check if containers are already running
if docker ps | grep xdc-frontend-dev > /dev/null; then
  echo -e "${YELLOW}Frontend development container is already running.${NC}"
  echo -e "${YELLOW}Do you want to restart it? (y/n)${NC}"
  read -r answer
  if [[ $answer =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker compose -p xdc down
  else
    echo -e "${GREEN}Exiting. Container is still running.${NC}"
    exit 0
  fi
fi

# Build and start the containers
echo -e "${YELLOW}Building and starting the development container...${NC}"
docker compose -p xdc up --build -d

# Check if container started successfully
if docker ps | grep xdc-frontend-dev > /dev/null; then
  echo -e "${GREEN}Development container started successfully!${NC}"
  echo -e "${GREEN}Vite development server is running at: http://localhost:3000${NC}"
  echo -e "${YELLOW}The source code is mounted to the container, so any changes you make will be reflected immediately.${NC}"
else
  echo -e "${RED}Failed to start container. Check the logs for more information:${NC}"
  docker compose -p xdc logs
  exit 1
fi

# Show logs
echo -e "${YELLOW}Showing container logs (press Ctrl+C to exit logs but keep the container running):${NC}"
docker compose -p xdc logs -f xdc
