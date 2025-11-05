# XDC Network Manager Frontend

A React-based web application for interacting with the NetworkManager contract on the XDC blockchain subnet. This application allows you to manage network members, update their details, check their status, and transfer the manager role.

## Features

- Connect to any XDC subnet node using RPC
- View all network members and their details
- Add new members with X.500 name and public key
- Update existing member details
- Remove members from the network
- Update member status (active/inactive)
- Transfer manager role to a new address
- Responsive UI with Bootstrap

## Prerequisites

- Node.js 14+ (for development)
- Docker and Docker Compose (for containerized deployment)
- Access to an XDC subnet node
- Deployed NetworkManager contract

## Installation and Setup

### Development Mode

1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file and set your XDC subnet RPC URL and contract address:
   ```
   REACT_APP_DEFAULT_RPC_URL=http://your-xdc-subnet-rpc-url
   REACT_APP_DEFAULT_CONTRACT_ADDRESS=0xYourContractAddress
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Open http://localhost:3000 in your browser

### Docker Deployment

1. Make sure Docker and Docker Compose are installed and running.

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Build and start the Docker container:
   ```bash
   docker-compose up -d --build
   ```

4. Access the application at http://localhost:3000

5. To stop the container:
   ```bash
   docker-compose down
   ```

## Configuration Options

### Environment Variables

| Variable                          | Description                             | Default                    |
|-----------------------------------|-----------------------------------------|----------------------------|
| REACT_APP_DEFAULT_RPC_URL         | Default XDC subnet RPC URL              | http://192.168.25.11:8545  |
| REACT_APP_DEFAULT_CONTRACT_ADDRESS| Default NetworkManager contract address | (empty)                    |
| REACT_APP_GAS_LIMIT               | Default gas limit for transactions      | 500000                     |
| REACT_APP_GAS_PRICE               | Default gas price (in wei)              | 1000000000 (1 gwei)        |

### Docker Configuration

You can customize the Docker deployment by editing the `docker-compose.yml` file. Some options include:

- Change the exposed port by modifying the `ports` section
- Add environment variables in the `environment` section
- Connect to a different network by modifying the `networks` section

## Connecting to the XDC Subnet

1. Start the application
2. On the initial screen, you'll be prompted to connect to an XDC subnet:
   - Enter the RPC URL for your XDC subnet (e.g., `http://192.168.25.11:8545`)
   - Enter the address of the deployed NetworkManager contract
   - Click "Connect"

3. Once connected, you'll see the main dashboard showing network members and the current manager.

## Usage Instructions

### Viewing Network Members

1. After connecting, the "Members" tab will display all network members.
2. Search for specific members using the search box.
3. Click on a member from the list to view their detailed information.

### Adding New Members (Manager Only)

1. Navigate to the "Add Member" tab (visible only to the manager).
2. Fill in the required information:
   - Member Address: The Ethereum/XDC address of the new member
   - X.500 Distinguished Name: The X.500 name in the format `CN=Name,O=Organization,C=Country`
   - Public Key: The member's public key
3. Click "Add Member" to add the member to the network.

### Updating Member Details (Manager Only)

1. Navigate to the "Update Member" tab (visible only to the manager).
2. Select a member from the dropdown list.
3. Modify the X.500 name or public key.
4. Click "Update Member" to save the changes.

### Updating Member Status (Manager Only)

1. Select a member from the member list.
2. In the member details panel, click "Set Active" or "Set Inactive" to change the member's status.

### Removing a Member (Manager Only)

1. Select a member from the member list.
2. In the member details panel, click "Remove Member".
3. Confirm the action when prompted.

### Transferring Manager Role (Manager Only)

1. Navigate to the "Contract Management" tab (visible only to the manager).
2. Enter the Ethereum/XDC address of the new manager.
3. Click "Transfer Manager Role".
4. Confirm the action when prompted.

## Security Considerations

- Ensure your private key is secure when interacting with the contract.
- Use HTTPS if deploying to a production environment.
- Review all transactions carefully before confirming, especially manager transfers.

## Troubleshooting

### Connection Issues
- Verify the RPC URL is correct and the XDC subnet node is running.
- Check that your network can access the XDC subnet.
- Ensure you're using the correct contract address.

### Transaction Failures
- Check that you have sufficient XDC balance for gas.
- Verify you're using an account with appropriate permissions.
- Increase gas limit for complex operations.

### Docker Issues
- Make sure the `docker_net` network exists by running `docker network ls`.
- If it doesn't exist, create it with `docker network create --subnet=192.168.25.0/24 --driver=bridge docker_net`.
