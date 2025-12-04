# PKI Implementation Guide for XDC Subnet

This guide explains how to implement a robust, permissioned P2P connection system in an XDC subnet using Private PKI infrastructure combined with the NetworkManager smart contract for on-chain governance.

## Overview

The system combines:
- **Off-chain PKI**: X.509 certificates for mutual TLS (mTLS) authentication
- **On-chain Governance**: Smart contract registry for approved nodes
- **Node Configuration**: Secure P2P and gRPC connections using certificates

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Off-Chain PKI System                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Root CA    │→ │ Node Cert 1  │  │ Node Cert 2  │     │
│  │ Certificate  │→ │   (signed)   │  │   (signed)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              NetworkManager Smart Contract                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  On-Chain Registry                                    │  │
│  │  - X.500 Names                                        │  │
│  │  - Certificate Serial Numbers                         │  │
│  │  - Network Endpoints (host:port)                      │  │
│  │  - Active Status                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Node P2P Connections                      │
│              (mTLS using X.509 certificates)                 │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Establish Your Private PKI (Off-Chain)

### 1.1 Set Up Certificate Authority (CA)

Choose one of the following PKI solutions:

#### Option A: OpenSSL (Manual, for testing/small deployments)

```bash
# Create CA directory structure
mkdir -p ca/{private,certs,newcerts,csr}
cd ca
touch index.txt
echo 1000 > serial

# Create CA configuration
cat > openssl-ca.cnf << 'EOF'
[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = .
certs             = $dir/certs
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
private_key       = $dir/private/ca.key
certificate       = $dir/certs/ca.crt
default_md        = sha256
policy            = policy_strict
default_days      = 365

[ policy_strict ]
countryName             = match
stateOrProvinceName     = match
organizationName        = match
organizationalUnitName  = optional
commonName              = supplied

[ req ]
distinguished_name = req_distinguished_name
x509_extensions   = v3_ca

[ req_distinguished_name ]
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
organizationName                = Organization Name
commonName                      = Common Name

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ server_cert ]
basicConstraints = CA:FALSE
nsCertType = server
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
EOF

# Generate Root CA private key
openssl genrsa -aes256 -out private/ca.key 4096

# Generate Root CA certificate
openssl req -config openssl-ca.cnf -key private/ca.key \
  -new -x509 -days 3650 -sha256 -extensions v3_ca \
  -out certs/ca.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=XDC Subnet/CN=XDC Subnet Root CA"
```

#### Option B: HashiCorp Vault (Recommended for production)

```bash
# Start Vault in dev mode (for testing)
vault server -dev

# Enable PKI secrets engine
vault secrets enable pki

# Configure max lease TTL
vault secrets tune -max-lease-ttl=87600h pki

# Generate root certificate
vault write -field=certificate pki/root/generate/internal \
    common_name="XDC Subnet Root CA" \
    ttl=87600h > ca.crt

# Configure CA and CRL URLs
vault write pki/config/urls \
    issuing_certificates="http://vault.example.com:8200/v1/pki/ca" \
    crl_distribution_points="http://vault.example.com:8200/v1/pki/crl"

# Create a role for issuing node certificates
vault write pki/roles/xdc-node \
    allowed_domains="xdc.network" \
    allow_subdomains=true \
    max_ttl="8760h" \
    key_type="ec" \
    key_bits=256
```

### 1.2 Distribute Root CA Certificate

All nodes must trust the Root CA:

```bash
# On each node, install the Root CA certificate

# For Linux systems
sudo cp ca.crt /usr/local/share/ca-certificates/xdc-subnet-ca.crt
sudo update-ca-certificates

# For macOS
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain ca.crt
```

## Step 2: Generate Node Certificates

### 2.1 Generate Node Private Key and CSR

For each node operator:

```bash
# Generate node private key (ECDSA P-256 recommended for efficiency)
openssl ecparam -name prime256v1 -genkey -noout -out node.key

# Generate Certificate Signing Request (CSR)
openssl req -new -key node.key -out node.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=XDC Subnet/OU=Validators/CN=node-singapore-01.xdc.network"
```

### 2.2 CA Signs the CSR

#### Using OpenSSL:

```bash
# Sign the CSR with the CA
openssl ca -config openssl-ca.cnf \
  -extensions server_cert \
  -days 365 \
  -notext \
  -in node.csr \
  -out node.crt

# Extract certificate serial number (needed for smart contract)
SERIAL=$(openssl x509 -in node.crt -noout -serial | cut -d'=' -f2)
echo "Certificate Serial: 0x${SERIAL}"
```

#### Using HashiCorp Vault:

```bash
# Request certificate from Vault
vault write pki/issue/xdc-node \
    common_name="node-singapore-01.xdc.network" \
    ttl="8760h" \
    format=pem > node-bundle.json

# Extract components
cat node-bundle.json | jq -r .data.certificate > node.crt
cat node-bundle.json | jq -r .data.private_key > node.key
cat node-bundle.json | jq -r .data.serial_number

# Get serial in hex format
SERIAL=$(cat node-bundle.json | jq -r .data.serial_number)
SERIAL_HEX=$(echo "obase=16; ${SERIAL}" | bc)
echo "Certificate Serial (hex): 0x${SERIAL_HEX}"
```

## Step 3: Register Node in Smart Contract

### 3.1 Extract Certificate Information

```bash
# Extract X.500 Distinguished Name
X500_NAME=$(openssl x509 -in node.crt -noout -subject | sed 's/subject=//')

# Extract serial number in hex
CERT_SERIAL=$(openssl x509 -in node.crt -noout -serial | cut -d'=' -f2)

# Get node's Ethereum address
NODE_ADDRESS="0x1234567890123456789012345678901234567890"

# Node network details
HOST="node-singapore-01.xdc.network"
PORT=30303
PLATFORM_VERSION=1
```

### 3.2 Register in NetworkManager Contract

Using ethers.js:

```javascript
const { ethers } = require('ethers');

// Connect to XDC network
const provider = new ethers.JsonRpcProvider('https://rpc.xdc.network');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load contract
const networkManager = new ethers.Contract(
    CONTRACT_ADDRESS,
    NETWORK_MANAGER_ABI,
    wallet
);

// Register node
const tx = await networkManager.addMember(
    NODE_ADDRESS,                          // memberAddress
    X500_NAME,                             // x500Name  
    `0x${CERT_SERIAL}`,                   // certSerialHex
    PLATFORM_VERSION,                      // platformVersion
    HOST,                                  // host
    PORT                                   // port
);

await tx.wait();
console.log('Node registered successfully!');
```

Using web3.js:

```javascript
const Web3 = require('web3');

const web3 = new Web3('https://rpc.xdc.network');
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

const networkManager = new web3.eth.Contract(
    NETWORK_MANAGER_ABI,
    CONTRACT_ADDRESS
);

const tx = await networkManager.methods.addMember(
    NODE_ADDRESS,
    X500_NAME,
    `0x${CERT_SERIAL}`,
    PLATFORM_VERSION,
    HOST,
    PORT
).send({ from: account.address });

console.log('Node registered:', tx.transactionHash);
```

## Step 4: Configure Node for mTLS

### 4.1 Node Configuration File

Create a configuration file for your XDC node:

```yaml
# node-config.yaml
network:
  p2p:
    enabled: true
    port: 30303
    max_peers: 50
    
  tls:
    enabled: true
    cert_file: /path/to/node.crt
    key_file: /path/to/node.key
    ca_file: /path/to/ca.crt
    verify_peer: true
    
  grpc:
    enabled: true
    port: 50051
    tls:
      cert_file: /path/to/node.crt
      key_file: /path/to/node.key
      ca_file: /path/to/ca.crt
      client_auth: require

blockchain:
  network_id: 551  # XDC Subnet ID
  
smart_contracts:
  network_manager:
    address: "0xYourNetworkManagerAddress"
    check_interval: 300  # Check every 5 minutes
```

### 4.2 Node Startup Script

```bash
#!/bin/bash
# start-node.sh

# Verify certificates exist
if [ ! -f "node.crt" ] || [ ! -f "node.key" ] || [ ! -f "ca.crt" ]; then
    echo "Error: Certificate files not found!"
    exit 1
fi

# Verify certificate is valid
openssl verify -CAfile ca.crt node.crt
if [ $? -ne 0 ]; then
    echo "Error: Certificate verification failed!"
    exit 1
fi

# Start XDC node with mTLS
./XDC \
  --config node-config.yaml \
  --datadir ./data \
  --port 30303 \
  --rpc \
  --rpcaddr 0.0.0.0 \
  --rpcport 8545 \
  --rpccorsdomain "*" \
  --rpcapi eth,net,web3,personal,admin \
  --networkid 551 \
  --tls.cert node.crt \
  --tls.key node.key \
  --tls.cacert ca.crt \
  --verbosity 4
```

## Step 5: Peer Discovery and Connection

### 5.1 Query NetworkManager for Peers

Nodes should periodically query the smart contract for active peers:

```javascript
// peer-discovery.js
async function discoverPeers() {
    // Get all registered members
    const memberAddresses = await networkManager.getAllMembers();
    
    const activePeers = [];
    
    for (const address of memberAddresses) {
        const member = await networkManager.getMember(address);
        
        if (member.isActive) {
            activePeers.push({
                address: member.memberAddress,
                x500Name: member.x500Name,
                certSerial: member.certSerialHex,
                host: member.host,
                port: member.port,
                platformVersion: member.platformVersion
            });
        }
    }
    
    return activePeers;
}

// Connect to peers with mTLS
async function connectToPeers(peers) {
    for (const peer of peers) {
        try {
            await connectWithMTLS(peer);
            console.log(`Connected to ${peer.x500Name}`);
        } catch (error) {
            console.error(`Failed to connect to ${peer.x500Name}:`, error);
        }
    }
}
```

### 5.2 mTLS Connection Verification

When a peer connection is established, verify:

1. **Certificate Chain**: Validate against Root CA
2. **Certificate Serial**: Match against smart contract registry
3. **X.500 Name**: Verify matches registered name
4. **Revocation Status**: Check if still active in contract

```javascript
async function verifyPeerCertificate(peerCert, peerAddress) {
    // Get member info from smart contract
    const member = await networkManager.getMember(peerAddress);
    
    // Extract certificate serial from peer's cert
    const certSerial = extractSerialFromCert(peerCert);
    
    // Verify serial matches registered serial
    if (certSerial !== member.certSerialHex) {
        throw new Error('Certificate serial mismatch');
    }
    
    // Verify member is active
    if (!member.isActive) {
        throw new Error('Member is not active in registry');
    }
    
    // Verify certificate chain
    if (!verifyCertChain(peerCert, caCert)) {
        throw new Error('Certificate chain verification failed');
    }
    
    return true;
}
```

## Step 6: Certificate Lifecycle Management

### 6.1 Certificate Renewal

Before certificates expire:

```bash
# Generate new CSR
openssl req -new -key node.key -out node-renewal.csr \
  -subj "/C=US/ST=California/O=XDC Subnet/CN=node-singapore-01.xdc.network"

# CA signs new certificate
openssl ca -config openssl-ca.cnf \
  -extensions server_cert \
  -in node-renewal.csr \
  -out node-new.crt

# Extract new serial
NEW_SERIAL=$(openssl x509 -in node-new.crt -noout -serial | cut -d'=' -f2)

# Update smart contract
await networkManager.updateMemberDetails(
    NODE_ADDRESS,
    X500_NAME,
    `0x${NEW_SERIAL}`,
    PLATFORM_VERSION,
    HOST,
    PORT
);

# Replace old certificate
mv node.crt node-old.crt
mv node-new.crt node.crt

# Restart node
./restart-node.sh
```

### 6.2 Certificate Revocation

If a certificate is compromised:

```bash
# Revoke certificate with CA
openssl ca -config openssl-ca.cnf -revoke node.crt

# Deactivate in smart contract
await networkManager.updateMemberStatus(NODE_ADDRESS, false);

# Or remove completely
await networkManager.removeMember(NODE_ADDRESS);
```

### 6.3 Generate and Publish CRL

```bash
# Generate Certificate Revocation List
openssl ca -config openssl-ca.cnf -gencrl -out crl.pem

# Publish CRL (make accessible to all nodes)
cp crl.pem /var/www/pki/crl.pem

# Nodes should periodically fetch and check CRL
curl https://pki.xdc.network/crl.pem -o crl.pem
```

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Certificate Expiry

```bash
#!/bin/bash
# check-cert-expiry.sh

CERT_FILE="node.crt"
WARNING_DAYS=30

# Get expiry date
EXPIRY=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $WARNING_DAYS ]; then
    echo "WARNING: Certificate expires in $DAYS_LEFT days!"
    # Send alert
    send_alert "Certificate expiring soon"
fi
```

### 7.2 Monitor Contract Events

```javascript
// Monitor NetworkManager events
networkManager.on('MemberAdded', (address, x500Name, certSerial) => {
    console.log(`New member added: ${x500Name}`);
    // Refresh peer list
    discoverPeers();
});

networkManager.on('MemberRemoved', (address) => {
    console.log(`Member removed: ${address}`);
    // Disconnect from peer if connected
    disconnectPeer(address);
});

networkManager.on('MemberUpdated', (address) => {
    console.log(`Member updated: ${address}`);
    // Refresh peer information
    updatePeerInfo(address);
});
```

## Security Best Practices

1. **Key Storage**
   - Store private keys in Hardware Security Modules (HSM)
   - Use encrypted key stores with strong passwords
   - Implement key access controls

2. **Certificate Management**
   - Use short validity periods (e.g., 1 year)
   - Implement automated renewal processes
   - Maintain certificate inventory

3. **Access Control**
   - Limit CA access to authorized personnel
   - Use multi-signature for smart contract operations
   - Implement role-based access control

4. **Monitoring**
   - Log all certificate operations
   - Monitor for unauthorized connection attempts
   - Alert on certificate expiry

5. **Backup and Recovery**
   - Backup CA private key securely
   - Document recovery procedures
   - Test disaster recovery plan

## Troubleshooting

### Issue: mTLS Connection Fails

```bash
# Check certificate validity
openssl verify -CAfile ca.crt node.crt

# Check certificate details
openssl x509 -in node.crt -text -noout

# Test TLS connection
openssl s_client -connect node.xdc.network:30303 \
  -cert node.crt -key node.key -CAfile ca.crt
```

### Issue: Certificate Serial Mismatch

```bash
# Get serial from certificate
openssl x509 -in node.crt -noout -serial

# Query smart contract
cast call $CONTRACT_ADDRESS "getMember(address)" $NODE_ADDRESS

# Update if mismatch
cast send $CONTRACT_ADDRESS "updateMemberDetails(...)" ...
```

## Conclusion

This PKI-based approach provides:
- **Strong Authentication**: X.509 certificates with mTLS
- **On-Chain Governance**: Smart contract registry for validation
- **Flexible Management**: Certificate lifecycle management
- **Scalability**: Suitable for large subnet deployments

The combination of off-chain PKI and on-chain governance creates a robust, secure, and manageable permissioned network for XDC subnets.
