# Example Member Data for NetworkManager Contract

This file contains example member data for the PKI-based NetworkManager contract implementation. The contract works in conjunction with an off-chain Private PKI/CA system for managing X.509 certificates.

## Member Structure

Each member has the following fields:
- **memberAddress**: Ethereum address of the member node
- **x500Name**: X.500 Distinguished Name from the X.509 certificate
- **certSerialHex**: Hexadecimal representation of the X.509 Certificate Serial Number
- **platformVersion**: Version of the node software
- **host**: Hostname or IP address for network connection
- **port**: Port number for P2P/gRPC connections

## Example Members

### Member 1 - Singapore Node
```json
{
  "memberAddress": "0x1234567890123456789012345678901234567890",
  "x500Name": "CN=Singapore-Node-01, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG",
  "certSerialHex": "0x0a1b2c3d4e5f6071",
  "platformVersion": 1,
  "host": "node-sg-01.xdc.network",
  "port": 30303
}
```

### Member 2 - London Node
```json
{
  "memberAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  "x500Name": "CN=London-Node-01, O=XDC Network, OU=Europe, L=London, C=GB",
  "certSerialHex": "0x1a2b3c4d5e6f7081",
  "platformVersion": 1,
  "host": "node-lon-01.xdc.network",
  "port": 30303
}
```

### Member 3 - New York Node
```json
{
  "memberAddress": "0x9876543210987654321098765432109876543210",
  "x500Name": "CN=NewYork-Node-01, O=XDC Network, OU=North America, L=New York, ST=NY, C=US",
  "certSerialHex": "0x2b3c4d5e6f708192",
  "platformVersion": 1,
  "host": "node-ny-01.xdc.network",
  "port": 30303
}
```

### Member 4 - Tokyo Node
```json
{
  "memberAddress": "0x1111111111111111111111111111111111111111",
  "x500Name": "CN=Tokyo-Node-01, O=XDC Network, OU=Asia Pacific, L=Tokyo, C=JP",
  "certSerialHex": "0x3c4d5e6f708192a3",
  "platformVersion": 1,
  "host": "node-tok-01.xdc.network",
  "port": 30303
}
```

### Member 5 - Frankfurt Node
```json
{
  "memberAddress": "0x2222222222222222222222222222222222222222",
  "x500Name": "CN=Frankfurt-Node-01, O=XDC Network, OU=Europe, L=Frankfurt, C=DE",
  "certSerialHex": "0x4d5e6f708192a3b4",
  "platformVersion": 1,
  "host": "node-fra-01.xdc.network",
  "port": 30303
}
```

### Member 6 - Sydney Node
```json
{
  "memberAddress": "0x3333333333333333333333333333333333333333",
  "x500Name": "CN=Sydney-Node-01, O=XDC Network, OU=Oceania, L=Sydney, ST=NSW, C=AU",
  "certSerialHex": "0x5e6f708192a3b4c5",
  "platformVersion": 1,
  "host": "node-syd-01.xdc.network",
  "port": 30303
}
```

## Solidity Test Data Format

For use in Solidity tests or scripts:

```solidity
// Member 1
address member1 = 0x1234567890123456789012345678901234567890;
string memory x500Name1 = "CN=Singapore-Node-01, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG";
bytes memory certSerial1 = hex"0a1b2c3d4e5f6071";
uint16 platformVersion1 = 1;
string memory host1 = "node-sg-01.xdc.network";
uint16 port1 = 30303;

// Member 2
address member2 = 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd;
string memory x500Name2 = "CN=London-Node-01, O=XDC Network, OU=Europe, L=London, C=GB";
bytes memory certSerial2 = hex"1a2b3c4d5e6f7081";
uint16 platformVersion2 = 1;
string memory host2 = "node-lon-01.xdc.network";
uint16 port2 = 30303;

// Member 3
address member3 = 0x9876543210987654321098765432109876543210;
string memory x500Name3 = "CN=NewYork-Node-01, O=XDC Network, OU=North America, L=New York, ST=NY, C=US";
bytes memory certSerial3 = hex"2b3c4d5e6f708192";
uint16 platformVersion3 = 1;
string memory host3 = "node-ny-01.xdc.network";
uint16 port3 = 30303;
```

## JavaScript/TypeScript Format

For frontend integration or deployment scripts:

```typescript
const exampleMembers = [
  {
    memberAddress: "0x1234567890123456789012345678901234567890",
    x500Name: "CN=Singapore-Node-01, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG",
    certSerialHex: "0x0a1b2c3d4e5f6071",
    platformVersion: 1,
    host: "node-sg-01.xdc.network",
    port: 30303
  },
  {
    memberAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    x500Name: "CN=London-Node-01, O=XDC Network, OU=Europe, L=London, C=GB",
    certSerialHex: "0x1a2b3c4d5e6f7081",
    platformVersion: 1,
    host: "node-lon-01.xdc.network",
    port: 30303
  },
  {
    memberAddress: "0x9876543210987654321098765432109876543210",
    x500Name: "CN=NewYork-Node-01, O=XDC Network, OU=North America, L=New York, ST=NY, C=US",
    certSerialHex: "0x2b3c4d5e6f708192",
    platformVersion: 1,
    host: "node-ny-01.xdc.network",
    port: 30303
  }
];

export default exampleMembers;
```

## Extracting Certificate Serial from X.509 Certificate

### Using OpenSSL

```bash
# Extract serial number in hexadecimal format
openssl x509 -in node.crt -noout -serial | cut -d'=' -f2

# Example output: 0A1B2C3D4E5F6071

# Add 0x prefix for Solidity
echo "0x$(openssl x509 -in node.crt -noout -serial | cut -d'=' -f2)"
```

### Using Node.js

```javascript
const forge = require('node-forge');
const fs = require('fs');

// Read certificate
const certPem = fs.readFileSync('node.crt', 'utf8');
const cert = forge.pki.certificateFromPem(certPem);

// Get serial number
const serialHex = cert.serialNumber;
console.log(`Certificate Serial: 0x${serialHex}`);
```

### Using Python

```python
from cryptography import x509
from cryptography.hazmat.backends import default_backend

# Load certificate
with open('node.crt', 'rb') as f:
    cert_data = f.read()
    
cert = x509.load_pem_x509_certificate(cert_data, default_backend())

# Get serial number
serial = cert.serial_number
serial_hex = format(serial, 'x').upper()
print(f"Certificate Serial: 0x{serial_hex}")
```

## Smart Contract Integration Examples

### Adding a Member

```javascript
// Using ethers.js
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://rpc.xdc.network');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const networkManager = new ethers.Contract(contractAddress, abi, wallet);

// Extract certificate serial from node certificate
const certSerial = '0x0a1b2c3d4e5f6071';

const tx = await networkManager.addMember(
  '0x1234567890123456789012345678901234567890',
  'CN=Singapore-Node-01, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG',
  certSerial,
  1,
  'node-sg-01.xdc.network',
  30303
);

await tx.wait();
console.log('Member added successfully!');
```

### Querying Member Information

```javascript
// Get member details
const member = await networkManager.getMember(memberAddress);

console.log('X.500 Name:', member.x500Name);
console.log('Certificate Serial:', member.certSerialHex);
console.log('Host:', member.host);
console.log('Port:', member.port);
console.log('Is Active:', member.isActive);
console.log('Platform Version:', member.platformVersion);
```

### Updating Certificate (Re-issuance)

```javascript
// When certificate is renewed, update the serial in the contract
const newCertSerial = '0x0a1b2c3d4e5f6099'; // New serial after renewal

const tx = await networkManager.updateMemberDetails(
  memberAddress,
  x500Name,
  newCertSerial,
  platformVersion,
  host,
  port
);

await tx.wait();
console.log('Certificate serial updated!');
```

## cURL Command Examples

For API testing:

```bash
# Add Member 1
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "memberAddress": "0x1234567890123456789012345678901234567890",
    "x500Name": "CN=Singapore-Node-01, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG",
    "certSerialHex": "0x0a1b2c3d4e5f6071",
    "platformVersion": 1,
    "host": "node-sg-01.xdc.network",
    "port": 30303
  }'

# Get member information
curl http://localhost:3000/api/members/0x1234567890123456789012345678901234567890
```

## Complete Node Registration Workflow

### 1. Generate Node Certificate

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out node.key

# Generate CSR
openssl req -new -key node.key -out node.csr \
  -subj "/C=SG/ST=Singapore/L=Singapore/O=XDC Network/OU=Asia Pacific/CN=node-sg-01.xdc.network"

# CA signs the CSR (done by CA administrator)
openssl ca -config ca.cnf -in node.csr -out node.crt

# Extract serial
CERT_SERIAL=$(openssl x509 -in node.crt -noout -serial | cut -d'=' -f2)
echo "Certificate Serial: 0x${CERT_SERIAL}"
```

### 2. Register in Smart Contract

```bash
# Using cast (Foundry)
cast send $CONTRACT_ADDRESS \
  "addMember(address,string,bytes,uint16,string,uint16)" \
  0x1234567890123456789012345678901234567890 \
  "CN=node-sg-01.xdc.network, O=XDC Network, OU=Asia Pacific, L=Singapore, C=SG" \
  0x${CERT_SERIAL} \
  1 \
  "node-sg-01.xdc.network" \
  30303 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://rpc.xdc.network
```

### 3. Configure Node

```yaml
# node-config.yaml
network:
  tls:
    enabled: true
    cert_file: /path/to/node.crt
    key_file: /path/to/node.key
    ca_file: /path/to/ca.crt

smart_contracts:
  network_manager:
    address: "0xYourContractAddress"
```

### 4. Start Node

```bash
# Node verifies certificate serial with smart contract on startup
./start-node.sh
```

## Notes

1. **X.500 Distinguished Names**: Follow the X.500 naming format:
   - CN = Common Name (usually the node's DNS name)
   - O = Organization
   - OU = Organizational Unit
   - L = Locality/City
   - ST = State/Province (optional)
   - C = Country (ISO 3166-1 alpha-2 code)

2. **Certificate Serial Numbers**: 
   - Unique identifier for each X.509 certificate
   - Used to match on-chain registration with off-chain certificate
   - Format: Hexadecimal bytes (e.g., `0x0a1b2c3d4e5f6071`)
   - Can be any length, typically 8-20 bytes

3. **PKI Integration**:
   - Certificates are issued and managed off-chain by a Private CA
   - Smart contract stores only metadata (serial number, not full certificate)
   - Nodes use mTLS with X.509 certificates for P2P connections
   - Certificate serial enables revocation checking

4. **Certificate Lifecycle**:
   - When certificate expires, generate new certificate with new serial
   - Update smart contract with new serial number
   - Old serial becomes invalid
   - Nodes should reject connections with unregistered serials

5. **Security Considerations**:
   - Certificate private keys must be protected (HSM recommended)
   - Only contract owner can add/update members
   - Nodes should verify peer certificates against smart contract registry
   - Implement certificate revocation list (CRL) checking

6. **Address Mapping**:
   - Each node has both an Ethereum address and X.509 certificate
   - Address is used for on-chain operations
   - Certificate is used for off-chain P2P authentication
   - Both must be validated for secure communication

## See Also

- [PKI Implementation Guide](./PKI_IMPLEMENTATION_GUIDE.md) - Complete guide for setting up PKI infrastructure
- [NetworkManager Contract](./contracts/NetworkManager.sol) - Smart contract source code
- [Example JSON Data](./example-members.json) - Machine-readable example data
