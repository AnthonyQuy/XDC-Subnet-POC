#!/bin/bash

# XDC Subnet Management Script
# Version: 1.0.0
# Description: Comprehensive management tool for XDC subnet deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
HOSTPWD="$SCRIPT_DIR"

# Export HOSTPWD for docker-compose
export HOSTPWD

# Helper functions
print_header() {
    printf "${CYAN}================================================${NC}\n"
    printf "${CYAN}%s${NC}\n" "$1"
    printf "${CYAN}================================================${NC}\n"
}

print_success() {
    printf "${GREEN}✓ %s${NC}\n" "$1"
}

print_error() {
    printf "${RED}✗ %s${NC}\n" "$1"
}

print_warning() {
    printf "${YELLOW}⚠ %s${NC}\n" "$1"
}

print_info() {
    printf "${BLUE}ℹ %s${NC}\n" "$1"
}

# Check if docker-compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
}

# Subnet Management Functions
start_subnet() {
    print_header "Starting XDC Subnet"
    
    # Create docker network if it doesn't exist
    if ! docker network inspect docker_net &> /dev/null; then
        print_info "Creating docker network..."
        docker network create --driver bridge --subnet=192.168.25.0/24 docker_net
        print_success "Docker network created"
    fi
    
    print_info "Starting bootnode..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile machine1 up -d bootnode
    sleep 3
    
    print_info "Starting validator nodes..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile machine1 up -d subnet1 subnet2 subnet3
    sleep 5
    
    print_info "Starting services..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile services up -d stats relayer frontend
    
    print_success "Subnet started successfully"
    print_info "Waiting for nodes to fully initialize (30 seconds)..."
    sleep 30
    
    check_subnet_status
}

start_subswap() {
    print_header "Starting SubSwap Frontend"
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile subswap up -d subswap_frontend
    print_success "SubSwap frontend started"
    print_info "Access SubSwap at: http://localhost:5216"
}

stop_subnet() {
    print_header "Stopping XDC Subnet"
    
    print_info "Stopping all services..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile machine1 --profile services --profile subswap down
    
    print_success "Subnet stopped successfully"
}

restart_subnet() {
    print_header "Restarting XDC Subnet"
    stop_subnet
    sleep 3
    start_subnet
}

stop_service() {
    local service=$1
    print_info "Stopping $service..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" stop "$service"
    print_success "$service stopped"
}

start_service() {
    local service=$1
    local profile=${2:-machine1}
    print_info "Starting $service..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile "$profile" up -d "$service"
    print_success "$service started"
}

restart_service() {
    local service=$1
    local profile=${2:-machine1}
    print_info "Restarting $service..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" restart "$service"
    print_success "$service restarted"
}

# Network Monitoring Functions
check_subnet_status() {
    print_header "Subnet Status"
    
    printf "${YELLOW}Running Containers:${NC}\n"
    docker ps --filter "name=subnet" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    printf "\n"
    
    check_peers
    printf "\n"
    check_mining
}

check_peers() {
    print_info "Checking peer connections..."
    
    for port in 8545 8546 8547; do
        local node_name="Node on port $port"
        local resp=$(curl -s --max-time 5 --location "http://localhost:$port" \
            --header 'Content-Type: application/json' \
            --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' 2>/dev/null)
        
        if [ -n "$resp" ]; then
            local num_peers=$(echo "$resp" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$num_peers" ]; then
                local num_peers_dec=$(printf "%d\n" "$num_peers" 2>/dev/null || echo "0")
                if [ "$num_peers_dec" -ge 2 ]; then
                    printf "  ${GREEN}✓${NC} %s: %s peers\n" "$node_name" "$num_peers_dec"
                else
                    printf "  ${YELLOW}⚠${NC} %s: %s peers (expected 2)\n" "$node_name" "$num_peers_dec"
                fi
            fi
        else
            printf "  ${RED}✗${NC} %s: Not responding (may need more time to start)\n" "$node_name"
        fi
    done
}

check_mining() {
    print_info "Checking block mining status..."
    
    local resp=$(curl -s --max-time 5 --location 'http://localhost:8545' \
        --header 'Content-Type: application/json' \
        --data '{"jsonrpc":"2.0","method":"XDPoS_getV2BlockByNumber","params":["latest"],"id":1}' 2>/dev/null)
    
    local num=$(echo "$resp" | grep -o '"Number":[0-9]*' | cut -d':' -f2 | tr -d ' ')
    
    if [[ -z "$num" ]] || [[ "$num" == "null" ]]; then
        print_error "No blocks have been mined yet (nodes may still be starting)"
        print_info "Try running: ./subnet-manager.sh status in a few moments"
        return 1
    fi
    
    printf "  Current block: %s\n" "$num"
    
    sleep 3
    
    local resp2=$(curl -s --max-time 5 --location 'http://localhost:8545' \
        --header 'Content-Type: application/json' \
        --data '{"jsonrpc":"2.0","method":"XDPoS_getV2BlockByNumber","params":["latest"],"id":1}' 2>/dev/null)
    
    local num2=$(echo "$resp2" | grep -o '"Number":[0-9]*' | cut -d':' -f2 | tr -d ' ')
    
    if [[ "$num2" -gt "$num" ]]; then
        print_success "Subnet is actively mining blocks (Block: $num2)"
    else
        print_warning "Block number hasn't increased. Mining may be stalled."
    fi
}

get_block_number() {
    local port=${1:-8545}
    
    local resp=$(curl -s --location "http://localhost:$port" \
        --header 'Content-Type: application/json' \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null)
    
    local block_hex=$(echo "$resp" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$block_hex" ]; then
        local block_dec=$(printf "%d\n" "$block_hex" 2>/dev/null || echo "0")
        echo "$block_dec"
    else
        echo "0"
    fi
}

get_balance() {
    local address=$1
    local port=${2:-8545}
    
    if [[ ! "$address" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        print_error "Invalid address format"
        return 1
    fi
    
    local resp=$(curl -s --location "http://localhost:$port" \
        --header 'Content-Type: application/json' \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$address\",\"latest\"],\"id\":1}" 2>/dev/null)
    
    local balance_hex=$(echo "$resp" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$balance_hex" ]; then
        # Convert hex to decimal and then to ether (divide by 10^18)
        local balance_wei=$(printf "%d\n" "$balance_hex" 2>/dev/null || echo "0")
        local balance_ether=$(echo "scale=18; $balance_wei / 1000000000000000000" | bc 2>/dev/null || echo "0")
        echo "$balance_ether SDC"
    else
        echo "Unable to fetch balance"
    fi
}

check_wallet_balances() {
    print_header "Subnet Wallet Balances"
    
    # Define wallet addresses (using arrays instead of associative array)
    local wallet_names=("Validator 1" "Validator 2" "Validator 3" "Foundation Wallet")
    local wallet_addresses=(
        "0x2df20ad7ca79f6427cd339f16d98e3d05e1b4a91"
        "0x41fe3a4527d9e601fee6018d10c990954c283559"
        "0x566c95cc89db31a10b52c051bbb84347c87f27cc"
        "0x6a9442d19ea82a24b33018bb6807bde679f92a45"
    )
    
    # RPC ports for each node
    local ports=(8545 8546 8547)
    local node_names=("Node 1" "Node 2" "Node 3")
    
    # Check each wallet
    for idx in "${!wallet_names[@]}"; do
        local wallet_name="${wallet_names[$idx]}"
        local address="${wallet_addresses[$idx]}"
        
        printf "\n${YELLOW}%s:${NC}\n" "$wallet_name"
        printf "  ${CYAN}Address:${NC} %s\n" "$address"
        
        # Check balance on each node
        for i in "${!ports[@]}"; do
            local port="${ports[$i]}"
            local node_name="${node_names[$i]}"
            
            local resp=$(curl -s --max-time 5 --location "http://localhost:$port" \
                --header 'Content-Type: application/json' \
                --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$address\",\"latest\"],\"id\":1}" 2>/dev/null)
            
            local balance_hex=$(echo "$resp" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
            
            if [ -n "$balance_hex" ] && [ "$balance_hex" != "null" ]; then
                local balance_wei=$(printf "%d\n" "$balance_hex" 2>/dev/null || echo "0")
                local balance_ether=$(echo "scale=4; $balance_wei / 1000000000000000000" | bc 2>/dev/null || echo "0")
                printf "  ${GREEN}%s (%s):${NC} %s SDC\n" "$node_name" "$port" "$balance_ether"
            else
                printf "  ${RED}%s (%s):${NC} Unable to fetch balance\n" "$node_name" "$port"
            fi
        done
    done
    
    printf "\n"
}

# Network Information Functions
show_network_info() {
    print_header "XDC Subnet Network Information"
    
    printf "${YELLOW}Network Configuration:${NC}\n"
    printf "  Chain ID: ${GREEN}57539${NC}\n"
    printf "  Network Name: ${GREEN}myxdcsubnet${NC}\n"
    printf "  Currency: ${GREEN}SDC${NC}\n"
    printf "\n"
    
    printf "${YELLOW}RPC Endpoints:${NC}\n"
    printf "  Node 1 (HTTP): ${GREEN}http://localhost:8545${NC}\n"
    printf "  Node 1 (WS): ${GREEN}ws://localhost:9555${NC}\n"
    printf "  Node 2 (HTTP): ${GREEN}http://localhost:8546${NC}\n"
    printf "  Node 2 (WS): ${GREEN}ws://localhost:9556${NC}\n"
    printf "  Node 3 (HTTP): ${GREEN}http://localhost:8547${NC}\n"
    printf "  Node 3 (WS): ${GREEN}ws://localhost:9557${NC}\n"
    printf "\n"
    
    printf "${YELLOW}Service Endpoints:${NC}\n"
    printf "  Stats Service: ${GREEN}http://localhost:5213${NC}\n"
    printf "  Relayer: ${GREEN}http://localhost:5215${NC}\n"
    printf "  Frontend: ${GREEN}http://localhost:5214${NC}\n"
    printf "  SubSwap: ${GREEN}http://localhost:5216${NC}\n"
    printf "\n"
    
    printf "${YELLOW}Validator Addresses:${NC}\n"
    printf "  Validator 1: ${GREEN}0x2df20ad7ca79f6427cd339f16d98e3d05e1b4a91${NC}\n"
    printf "  Validator 2: ${GREEN}0x41fe3a4527d9e601fee6018d10c990954c283559${NC}\n"
    printf "  Validator 3: ${GREEN}0x566c95cc89db31a10b52c051bbb84347c87f27cc${NC}\n"
    printf "\n"
    
    printf "${YELLOW}Foundation Wallet:${NC}\n"
    printf "  Address: ${GREEN}0x6a9442d19ea82a24b33018bb6807bde679f92a45${NC}\n"
}

show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        print_error "Please specify a service name"
        echo "Available services: subnet1, subnet2, subnet3, bootnode, stats, relayer, frontend, subswap_frontend"
        return 1
    fi
    
    print_header "Logs for $service"
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100 "$service"
}

attach_to_node() {
    local node=${1:-subnet1}
    local port
    
    # Map node name to RPC port
    case $node in
        subnet1) port=8545 ;;
        subnet2) port=8546 ;;
        subnet3) port=8547 ;;
        *) 
            print_error "Unknown node: $node"
            return 1
            ;;
    esac
    
    print_header "Attaching to $node console via HTTP RPC"
    print_info "Use 'exit' to detach from console"
    
    docker exec -it "$node" geth attach http://localhost:$port
}

exec_in_container() {
    local service=$1
    shift
    local cmd="$@"
    
    if [ -z "$service" ] || [ -z "$cmd" ]; then
        print_error "Usage: exec_in_container <service> <command>"
        return 1
    fi
    
    docker exec -it "$service" $cmd
}

send_transaction() {
    print_header "Send Test Transaction"
    
    read -p "From address: " from_addr
    read -p "To address: " to_addr
    read -p "Amount (in SDC): " amount
    read -sp "Private key (optional, press enter to skip): " private_key
    echo ""
    
    # Convert amount to wei (multiply by 10^18)
    local amount_wei=$(echo "$amount * 1000000000000000000" | bc | cut -d'.' -f1)
    local amount_hex=$(printf "0x%x" "$amount_wei")
    
    if [ -n "$private_key" ]; then
        print_info "Sending transaction..."
        # This would require web3 or similar tool
        print_warning "Transaction sending with private key requires additional tools"
        print_info "Use the attach_to_node function to send transactions via console"
    else
        print_info "Transaction details:"
        echo "  From: $from_addr"
        echo "  To: $to_addr"
        echo "  Amount: $amount SDC ($amount_hex wei)"
        print_info "Use attach_to_node to send this transaction via geth console"
    fi
}

# Utility Functions
create_docker_network() {
    if ! docker network inspect docker_net &> /dev/null; then
        print_info "Creating docker network..."
        docker network create --driver bridge --subnet=192.168.25.0/24 docker_net
        print_success "Docker network created"
    else
        print_info "Docker network already exists"
    fi
}

cleanup_subnet() {
    print_header "Cleaning Up Subnet"
    
    read -p "This will remove all containers, volumes, and the docker network. Continue? (y/N): " confirm
    
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        print_info "Cleanup cancelled"
        return 0
    fi
    
    print_warning "Stopping and removing all containers..."
    $DOCKER_COMPOSE_CMD -f "$DOCKER_COMPOSE_FILE" --profile machine1 --profile services --profile subswap down -v
    
    print_warning "Removing docker network..."
    docker network rm docker_net 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Interactive Menu
show_menu() {
    clear
    print_header "XDC Subnet Management Tool"
    printf "\n"
    printf "${CYAN}Subnet Management:${NC}\n"
    printf "  1) Start Subnet\n"
    printf "  2) Stop Subnet\n"
    printf "  3) Restart Subnet\n"
    printf "  4) Start SubSwap Frontend\n"
    printf "  5) Check Subnet Status\n"
    printf "\n"
    printf "${CYAN}Service Control:${NC}\n"
    printf "  6) Start/Stop/Restart Individual Service\n"
    printf "  7) View Service Logs\n"
    printf "\n"
    printf "${CYAN}Network Monitoring:${NC}\n"
    printf "  8) Check Peer Connections\n"
    printf "  9) Check Mining Status\n"
    printf " 10) Get Block Number\n"
    printf " 11) Check Address Balance\n"
    printf "\n"
    printf "${CYAN}Network Information:${NC}\n"
    printf " 12) Show Network Info\n"
    printf "\n"
    printf "${CYAN}Utilities:${NC}\n"
    printf " 13) Attach to Node Console\n"
    printf " 14) Send Test Transaction\n"
    printf " 15) Execute Command in Container\n"
    printf " 16) Create Docker Network\n"
    printf " 17) Cleanup Subnet\n"
    printf " 18) Check All Wallet Balances\n"
    printf "\n"
    printf " 0) Exit\n"
    printf "\n"
    read -p "Select an option: " choice
    
    case $choice in
        1) start_subnet ;;
        2) stop_subnet ;;
        3) restart_subnet ;;
        4) start_subswap ;;
        5) check_subnet_status ;;
        6) 
            echo ""
            read -p "Service name: " service
            read -p "Action (start/stop/restart): " action
            case $action in
                start) start_service "$service" ;;
                stop) stop_service "$service" ;;
                restart) restart_service "$service" ;;
                *) print_error "Invalid action" ;;
            esac
            ;;
        7)
            echo ""
            read -p "Service name: " service
            show_logs "$service"
            ;;
        8) check_peers ;;
        9) check_mining ;;
        10)
            echo ""
            read -p "RPC port (default: 8545): " port
            port=${port:-8545}
            block=$(get_block_number "$port")
            print_info "Current block number: $block"
            ;;
        11)
            echo ""
            read -p "Address: " address
            read -p "RPC port (default: 8545): " port
            port=${port:-8545}
            balance=$(get_balance "$address" "$port")
            print_info "Balance: $balance"
            ;;
        12) show_network_info ;;
        13)
            echo ""
            read -p "Node name (default: subnet1): " node
            node=${node:-subnet1}
            attach_to_node "$node"
            ;;
        14) send_transaction ;;
        15)
            echo ""
            read -p "Service name: " service
            read -p "Command: " cmd
            exec_in_container "$service" $cmd
            ;;
        16) create_docker_network ;;
        17) cleanup_subnet ;;
        18) check_wallet_balances ;;
        0) exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
    
    if [[ "$choice" != "7" && "$choice" != "13" ]]; then
        echo ""
        read -p "Press Enter to continue..."
    fi
}

# Main function
main() {
    check_docker_compose
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
        done
    else
        # Command-line mode
        case "$1" in
            start)
                start_subnet
                ;;
            stop)
                stop_subnet
                ;;
            restart)
                restart_subnet
                ;;
            status)
                check_subnet_status
                ;;
            peers)
                check_peers
                ;;
            mining)
                check_mining
                ;;
            info)
                show_network_info
                ;;
            logs)
                show_logs "$2"
                ;;
            attach)
                attach_to_node "$2"
                ;;
            balance)
                if [ -z "$2" ]; then
                    print_error "Usage: $0 balance <address> [port]"
                    exit 1
                fi
                balance=$(get_balance "$2" "$3")
                echo "$balance"
                ;;
            block)
                block=$(get_block_number "$2")
                echo "$block"
                ;;
            subswap)
                start_subswap
                ;;
            wallets)
                check_wallet_balances
                ;;
            cleanup)
                cleanup_subnet
                ;;
            help|--help|-h)
                print_header "XDC Subnet Manager - Help"
                echo ""
                echo "Usage: $0 [command] [options]"
                echo ""
                echo "Commands:"
                echo "  start              Start the subnet"
                echo "  stop               Stop the subnet"
                echo "  restart            Restart the subnet"
                echo "  status             Check subnet status"
                echo "  peers              Check peer connections"
                echo "  mining             Check mining status"
                echo "  info               Show network information"
                echo "  logs <service>     Show logs for a service"
                echo "  attach [node]      Attach to node console"
                echo "  balance <addr>     Check address balance"
                echo "  block [port]       Get current block number"
                echo "  wallets            Check all wallet balances"
                echo "  subswap            Start SubSwap frontend"
                echo "  cleanup            Clean up subnet (removes all data)"
                echo "  help               Show this help message"
                echo ""
                echo "If no command is provided, interactive menu will be shown."
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Use '$0 help' for usage information"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"
