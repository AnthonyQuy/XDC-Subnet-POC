# XDC Subnet PKI Bootstrap

Automated setup for Private Key Infrastructure (PKI) and member registration for XDC Subnet.

## Overview

This bootstrap tool automates the complete PKI setup process:

1. **Creates Root Certificate Authority (CA)** - Generates a self-signed CA for signing node certificates
2. **Generates Node Certificates** - Creates X.509 certificates for each member in `example-members.json`
3. **Registers Members** - Adds all members to the NetworkManager smart contract
4. **Generates Reports** - Creates comprehensive summaries of the setup

All generated files are organized in the `bootstrap/output/` directory.

## Prerequisites

### Required Tools

- **Node.js** (v18+) with npm/pnpm
- **OpenSSL** - For certificate generation
  - macOS: `brew install openssl` (usually pre-installed)
  - Ubuntu/Debian: `apt-get install openssl`
  - Windows: Download from [OpenSSL website](https://www.openssl.org/)

### Required Setup

1. **Deployed NetworkManager Contract**
   ```bash
   npm run deploy
   ```

2. **Environment Configuration** (`.env` file)
   ```env
   SUBNET_URL=http://192.168.25.11:8545
   SUBNET_PK=0x...your-private-key...
   ```

3. **Example Members File** - Ensure `example-members.json` exists with member data

## Quick Start

```bash
# Navigate to contracts directory
cd contracts

# Run the bootstrap
npm run bootstrap

# Verify the setup
npm run bootstrap:verify

# (Optional) Clean up PKI files
npm run bootstrap:cleanup
```

## Directory Structure

After running the bootstrap, the following structure is created:

```
contracts/bootstrap/
├── bootstrap.ts              # Main bootstrap script
├── verify-setup.ts            # Verification script
├── cleanup-pki.sh             # Cleanup script
├── README.md                  # This file
└── output/                    # Generated files (gitignored)
    ├── ca/                    # Root CA files
    │   ├── ca.key            # CA private key (KEEP SECURE!)
    │   ├── ca.crt            # CA certificate
    │   ├── openssl.cnf       # OpenSSL configuration
    │   ├── index.txt         # Certificate database
    │   ├── serial            # Serial number tracker
    │   ├── certs/            # Issued certificates
    │   └── newcerts/         # New certificates
    ├── certs/                 # Node certificates
    │   ├── singapore-node-01/
    │   │   ├── node.key      # Node private key
    │   │   ├── node.csr      # Certificate signing request
    │   │   └── node.crt      # Signed certificate
    │   ├── london-node-01/
    │   ├── newyork-node-01/
    │   ├── tokyo-node-01/
    │   ├── frankfurt-node-01/
    │   └── sydney-node-01/
    ├── logs/                  # Bootstrap execution logs
    │   └── bootstrap-TIMESTAMP.log
    ├── certificate-summary.json
    ├── registration-report.json
    └── BOOTSTRAP-SUMMARY.txt
```

## Commands

### Bootstrap PKI

Runs the complete bootstrap process:

```bash
npm run bootstrap
```

This will:
- Create Root CA with self-signed certificate
- Generate certificates for all members in `example-members.json`
- Register members in the NetworkManager smart contract
- Generate summary reports

**Output:**
- CA certificate and key in `output/ca/`
- Node certificates in `output/certs/[node-name]/`
- Summary reports in `output/`
- Execution log in `output/logs/`

### Verify Setup

Verifies the PKI setup and contract registration:

```bash
npm run bootstrap:verify
```

This checks:
- Root CA certificate validity
- Node certificate verification against CA
- Certificate expiration dates
- Contract registration status
- Member details in smart contract

### Cleanup PKI Files

Safely removes generated PKI files:

```bash
npm run bootstrap:cleanup
```

Features:
- Prompts for confirmation before deletion
- Optional backup before cleanup
- Preserves directory structure for next run

## Generated Reports

### BOOTSTRAP-SUMMARY.txt

Human-readable summary with:
- CA information
- Node certificate details (serial numbers, fingerprints)
- Network endpoints
- Next steps

### certificate-summary.json

Machine-readable certificate data:
```json
{
  "timestamp": "2025-12-04T...",
  "totalCertificates": 6,
  "caPath": "output/ca/ca.crt",
  "certificates": [
    {
      "memberAddress": "0x1234...",
      "nodeName": "singapore-node-01",
      "x500Name": "CN=Singapore-Node-01, O=XDC Network, ...",
      "certSerial": "0x1000",
      "fingerprint": "SHA256:...",
      "host": "node-sg-01.xdc.network",
      "port": 30303,
      "platformVersion": 1,
      "certificatePath": "output/certs/singapore-node-01/node.crt",
      "privateKeyPath": "output/certs/singapore-node-01/node.key"
    }
  ]
}
```

### registration-report.json

Contract registration results:
```json
{
  "timestamp": "2025-12-04T...",
  "contractAddress": "0xabcd...",
  "totalMembers": 6,
  "registered": 6,
  "skipped": 0,
  "members": [
    {
      "address": "0x1234...",
      "nodeName": "singapore-node-01",
      "x500Name": "CN=Singapore-Node-01, O=XDC Network, ...",
      "serial": "0x1000",
      "transactionHash": "0xdef..."
    }
  ]
}
```

## Security Best Practices

### CA Private Key Protection

⚠️ **CRITICAL**: The CA private key (`output/ca/ca.key`) is the most sensitive file.

- **Store securely** - Use encrypted storage or hardware security module (HSM)
- **Backup safely** - Keep encrypted backups in secure locations
- **Limit access** - Only authorized personnel should have access
- **Never commit** - The `output/` directory is gitignored by default

### Node Certificate Distribution

When distributing certificates to nodes:

1. **Secure Transfer**
   - Use encrypted channels (SSH, secure file transfer)
   - Verify file integrity with checksums

2. **File Permissions**
   ```bash
   chmod 600 node.key  # Private key: owner read/write only
   chmod 644 node.crt  # Certificate: readable by all
   ```

3. **Node Configuration**
   - Configure nodes to use mTLS with certificates
   - Enable certificate verification
   - Update node configs with paths to cert/key files

### Certificate Lifecycle

- **Validity Period**: Certificates are valid for 365 days by default
- **Renewal**: Monitor expiration with `npm run bootstrap:verify`
- **Revocation**: Use `updateMemberStatus(address, false)` to deactivate compromised certificates

## Troubleshooting

### OpenSSL Not Found

```
Error: OpenSSL not found!
```

**Solution**: Install OpenSSL for your platform (see Prerequisites)

### Contract Not Deployed

```
Error: Contract not deployed. Run 'npm run deploy' first.
```

**Solution**: Deploy the NetworkManager contract first:
```bash
npm run deploy
```

### Member Already Registered

```
Member 0x1234... already registered, skipping...
```

**This is normal** - The script skips already registered members. To re-register:
1. Remove the member using the interaction script
2. Run bootstrap again

Or use `npm run bootstrap:cleanup` to start fresh.

### Certificate Verification Failed

```
Error: Certificate verification failed
```

**Possible causes:**
- CA certificate corrupted
- Certificate not signed by CA
- File permissions issue

**Solution**: Run `npm run bootstrap:cleanup` and bootstrap again.

## Advanced Usage

### Custom Members File

To use a different members file:

1. Create your JSON file (same format as `example-members.json`)
2. Edit `bootstrap.ts` and change `MEMBERS_FILE` path
3. Run bootstrap

### Certificate Parameters

To customize certificate parameters, edit `bootstrap.ts`:

- **Key Algorithm**: Change from ECDSA P-256 to RSA:
  ```typescript
  execCommand(`openssl genrsa -out ${nodeDir}/node.key 2048`, true);
  ```

- **Validity Period**: Change from 365 days:
  ```typescript
  execCommand(`openssl ca ... -days 730 ...`, true);
  ```

- **CA Certificate**: Edit the OpenSSL config in `createCAConfig()`

### Manual Certificate Operations

Using the generated CA:

```bash
cd output/ca

# View CA certificate
openssl x509 -in ca.crt -text -noout

# Create new node certificate manually
openssl ecparam -name prime256v1 -genkey -noout -out new-node.key
openssl req -new -key new-node.key -out new-node.csr \
  -subj "/C=US/O=XDC Network/CN=new-node.xdc.network"
openssl ca -config openssl.cnf -extensions server_cert \
  -in new-node.csr -out new-node.crt

# Verify certificate
openssl verify -CAfile ca.crt new-node.crt
```

## Integration with Node Configuration

After running bootstrap, configure your XDC nodes to use the certificates:

### Example Node Config

```yaml
network:
  p2p:
    enabled: true
    port: 30303
    
  tls:
    enabled: true
    cert_file: /path/to/node.crt
    key_file: /path/to/node.key
    ca_file: /path/to/ca.crt
    verify_peer: true

blockchain:
  network_id: 551
  
smart_contracts:
  network_manager:
    address: "0xYourContractAddress"
    check_interval: 300
```

### Example Startup

```bash
./XDC \
  --config node-config.yaml \
  --datadir ./data \
  --tls.cert node.crt \
  --tls.key node.key \
  --tls.cacert ca.crt \
  --verbosity 4
```

## Related Documentation

- [PKI Implementation Guide](../PKI_IMPLEMENTATION_GUIDE.md) - Comprehensive PKI guide
- [NetworkManager Contract](../contracts/NetworkManager.sol) - Smart contract source
- [Contract Interaction](../scripts/hardhat-interact.ts) - Contract interaction tool
- [Example Members](../example-members.json) - Member configuration format

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review execution logs in `output/logs/`
3. Verify setup with `npm run bootstrap:verify`
4. Consult the PKI Implementation Guide

## License

MIT License - See project root for details
