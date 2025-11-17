#!/bin/bash

# Network Management Contract Build & Deployment Script

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' 

# Print header
echo -e "${GREEN}XDC Network Management Contract - Setup & Deployment${NC}"
echo "-------------------------------------------------"

# Check docker setup
check_docker() {
  echo -e "${YELLOW}Checking Docker environment...${NC}"
  
  # Make sure docker is running
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
  fi
  
  # Check if docker_net exists, create if not
  if ! docker network inspect docker_net > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating docker_net network...${NC}"
    docker network create --subnet=192.168.25.0/24 --driver=bridge docker_net
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to create docker_net network. Please check your Docker permissions.${NC}"
      exit 1
    fi
    echo -e "${GREEN}Network created successfully.${NC}"
  fi
}

# Stop any existing container
cleanup() {
  if docker ps -a | grep xdc-contract-dev > /dev/null; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker-compose down
  fi
}

# Start container
start_container() {
  echo -e "${YELLOW}Building contract development container...${NC}"
  docker-compose build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please check the build logs above.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Starting container...${NC}"
  docker-compose -p xdc up -d
  
  # Wait for container to start
  echo -e "${YELLOW}Waiting for container to start...${NC}"
  sleep 3
  
  # Check if container is running
  if ! docker ps | grep xdc-contract-dev > /dev/null; then
    echo -e "${RED}Container failed to start. Check docker logs:${NC}"
    docker-compose logs
    exit 1
  fi
  
  echo -e "${GREEN}Container started successfully!${NC}"
  echo ""
}

# Deploy contract with gas price info
deploy_contract() {
  echo -e "${BLUE}=== Contract Deployment Process ===${NC}"
  echo -e "${YELLOW}This will deploy the NetworkManager contract to the XDC subnet.${NC}"
  echo -e "${YELLOW}The deployment script will automatically try various gas prices if needed.${NC}"
  echo -e "${YELLOW}If deployment fails with 'under min gas price' error, it will retry with higher prices.${NC}"
  echo ""
  
  read -p "Continue with deployment? (y/n): " confirm
  if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo -e "${YELLOW}Deploying contract with Hardhat...${NC}"
    docker exec -it xdc-contract-dev npx hardhat run scripts/deploy.js --network subnet
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Deployment completed! Contract information saved to ./deployed directory${NC}"
    else
      echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
    fi
  fi
  echo ""
}

# Run checks and initialization
check_docker
cleanup
start_container

# Interact with contract
interact_with_contract() {
  echo -e "${BLUE}=== Contract Interaction Menu ===${NC}"
  echo -e "${YELLOW}Select a command to interact with the NetworkManager contract using Hardhat:${NC}"
  echo "1. Get current manager"
  echo "2. Add new member"
  echo "3. Remove member"
  echo "4. Get member details"
  echo "5. List all members"
  echo "6. Update member status"
  echo "7. Update member details"
  echo "8. Transfer manager role"
  echo "9. Check if address is a member"
  echo "10. Update subnet member details"
  echo "0. Return to main menu"
  
  read -p "Select option: " interact_option
  
  case $interact_option in
    1)
      docker exec -e COMMAND=getManager -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    2)
      read -p "Enter member address: " address
      read -p "Enter X500 name: " x500Name
      read -p "Enter public key: " publicKey
      read -p "Enter serial: " serial
      read -p "Enter platformVersion: " platformVersion
      read -p "Enter host: " host
      read -p "Enter port: " port
      docker exec -e COMMAND=addMember -e ARGS="$address|$x500Name|$publicKey|$serial|$platformVersion|$host|$port" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    3)
      read -p "Enter member address to remove: " address
      docker exec -e COMMAND=removeMember -e ARGS="$address" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    4)
      read -p "Enter member address: " address
      docker exec -e COMMAND=getMember -e ARGS="$address" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    5)
      docker exec -e COMMAND=getAllMembers -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    6)
      read -p "Enter member address: " address
      read -p "Set active (true/false): " active
      docker exec -e COMMAND=updateStatus -e ARGS="$address|$active" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    7)
      read -p "Enter member address: " address
      read -p "Enter new X500 name: " x500Name
      read -p "Enter new public key: " publicKey
      read -p "Enter serial: " serial
      read -p "Enter platformVersion: " platformVersion
      read -p "Enter host: " host
      read -p "Enter port: " port
      docker exec -e COMMAND=updateDetails -e ARGS="$address|$x500Name|$publicKey|$serial|$platformVersion|$host|$port" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    8)
      read -p "Enter new manager address: " address
      docker exec -e COMMAND=transferManager -e ARGS="$address" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    9)
      read -p "Enter address to check: " address
      docker exec -e COMMAND=isMember -e ARGS="$address" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    10)
      read -p "Enter member address: " address
      read -p "Enter serial number: " serial
      read -p "Enter platform version: " platformVersion
      read -p "Enter host address: " host
      read -p "Enter port number: " port
      docker exec -e COMMAND=updateSubnetMemberDetail -e ARGS="$address|$serial|$platformVersion|$host|$port" -it xdc-contract-dev npx hardhat run scripts/hardhat-interact.js --network subnet
      ;;
    0)
      return
      ;;
    *)
      echo -e "${RED}Invalid option.${NC}"
      ;;
  esac
  echo ""
  # Ask if the user wants to perform another interaction
  read -p "Any key to continue... " key
  interact_with_contract
}

# Menu options
while true; do
  echo -e "${BLUE}===== XDC Contract Management =====${NC}"
  echo "Choose an option:"
  echo "1. Compile the NetworkManager contract"
  echo "2. Deploy the contract to XDC Subnet"
  echo "3. Interact with deployed contract"
  echo "4. Run interactive shell in container"
  echo "5. View container logs"
  echo "6. Stop container"
  echo "q. Quit"
  
  read -p "Select option: " option
  
  case $option in
    1)
      echo -e "${YELLOW}Compiling contract with Hardhat...${NC}"
      docker exec -it xdc-contract-dev npx hardhat compile
      echo ""
      ;;
    2)
      deploy_contract
      ;;
    3)
      interact_with_contract
      ;;
    4)
    echo -e "${YELLOW}Starting interactive shell...${NC}"
    echo -e "${YELLOW}Tip: Inside the container, use 'npx hardhat run scripts/deploy.js --network subnet' to deploy the contract${NC}"
      docker exec -it xdc-contract-dev /bin/bash
      echo ""
      ;;
    5)
      echo -e "${YELLOW}Container logs:${NC}"
      docker logs xdc-contract-dev
      echo ""
      ;;
    6)
      echo -e "${YELLOW}Stopping container...${NC}"
      docker-compose down
      echo -e "${GREEN}Container stopped.${NC}"
      exit 0
      ;;
    q|Q)
      echo -e "${GREEN}Exiting.${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid option.${NC}"
      ;;
  esac
done
