#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createPublicClient, createWalletClient, http, getContract, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Configuration
const BOOTSTRAP_DIR = __dirname;
const OUTPUT_DIR = path.join(BOOTSTRAP_DIR, "output");
const CA_DIR = path.join(OUTPUT_DIR, "ca");
const CERTS_DIR = path.join(OUTPUT_DIR, "certs");
const LOGS_DIR = path.join(OUTPUT_DIR, "logs");
const MEMBERS_FILE = path.join(__dirname, "example-members.json");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

// Logging functions
function log(message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  appendLog(`[${timestamp}] ${message}`);
}

function success(message: string) {
  log(`✓ ${message}`, colors.green);
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function warn(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

function error(message: string) {
  log(`✗ ${message}`, colors.red);
}

function section(message: string) {
  const line = "═".repeat(60);
  log(`\n${line}`, colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log(`${line}\n`, colors.cyan);
}

const logFile = path.join(LOGS_DIR, `bootstrap-${Date.now()}.log`);
function appendLog(message: string) {
  fs.appendFileSync(logFile, message + "\n");
}

// Execute shell command with error handling
function execCommand(command: string, silent: boolean = false): string {
  try {
    const result = execSync(command, { 
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit"
    });
    return result;
  } catch (err: any) {
    error(`Command failed: ${command}`);
    error(`Error: ${err.message}`);
    throw err;
  }
}

// Check if OpenSSL is available
function checkOpenSSL(): boolean {
  try {
    execCommand("openssl version", true);
    return true;
  } catch {
    return false;
  }
}

// Create OpenSSL CA configuration
function createCAConfig(): void {
  const configContent = `
[ ca ]
default_ca = CA_default

[ CA_default ]
dir               = ${CA_DIR}
certs             = ${CA_DIR}/certs
new_certs_dir     = ${CA_DIR}/newcerts
database          = ${CA_DIR}/index.txt
serial            = ${CA_DIR}/serial
private_key       = ${CA_DIR}/ca.key
certificate       = ${CA_DIR}/ca.crt
default_md        = sha256
policy            = policy_loose
default_days      = 365
copy_extensions   = copy

[ policy_loose ]
countryName             = optional
stateOrProvinceName     = optional
localityName            = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied

[ req ]
distinguished_name = req_distinguished_name
x509_extensions   = v3_ca
prompt            = no

[ req_distinguished_name ]
C  = US
ST = California
L  = San Francisco
O  = XDC Network
OU = Subnet Infrastructure
CN = XDC Subnet Root CA

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
`;

  fs.writeFileSync(path.join(CA_DIR, "openssl.cnf"), configContent);
  success("Created OpenSSL CA configuration");
}

// Setup Root CA
async function setupRootCA(): Promise<void> {
  section("Setting Up Root Certificate Authority");

  // Create CA directory structure
  fs.ensureDirSync(path.join(CA_DIR, "certs"));
  fs.ensureDirSync(path.join(CA_DIR, "newcerts"));
  fs.writeFileSync(path.join(CA_DIR, "index.txt"), "");
  fs.writeFileSync(path.join(CA_DIR, "serial"), "1000\n");

  info("Creating CA directory structure...");
  createCAConfig();

  // Generate CA private key
  info("Generating CA private key (this may take a moment)...");
  execCommand(
    `openssl genrsa -out ${CA_DIR}/ca.key 4096`,
    true
  );
  success("Generated CA private key");

  // Generate self-signed CA certificate
  info("Generating self-signed CA certificate...");
  execCommand(
    `openssl req -config ${CA_DIR}/openssl.cnf -key ${CA_DIR}/ca.key ` +
    `-new -x509 -days 3650 -sha256 -extensions v3_ca ` +
    `-out ${CA_DIR}/ca.crt`,
    true
  );
  success("Generated CA certificate (valid for 10 years)");

  // Verify CA certificate
  info("Verifying CA certificate...");
  const caCert = execCommand(
    `openssl x509 -in ${CA_DIR}/ca.crt -noout -subject -issuer -dates`,
    true
  );
  console.log(caCert);
  success("Root CA setup complete");
}

// Generate node certificate
async function generateNodeCertificate(
  member: any,
  nodeName: string
): Promise<{ serial: string; fingerprint: string }> {
  const nodeDir = path.join(CERTS_DIR, nodeName);
  fs.ensureDirSync(nodeDir);

  info(`Generating certificate for ${nodeName}...`);

  // Generate private key (ECDSA P-256)
  execCommand(
    `openssl ecparam -name prime256v1 -genkey -noout -out ${nodeDir}/node.key`,
    true
  );

  // Create CSR
  const subject = member.x500Name.replace(/,\s+/g, "/").replace(/^/, "/");
  execCommand(
    `openssl req -new -key ${nodeDir}/node.key -out ${nodeDir}/node.csr ` +
    `-subj "${subject}"`,
    true
  );

  // Sign certificate with CA
  execCommand(
    `openssl ca -config ${CA_DIR}/openssl.cnf -batch ` +
    `-extensions server_cert -days 365 -notext ` +
    `-in ${nodeDir}/node.csr -out ${nodeDir}/node.crt`,
    true
  );

  // Extract certificate serial number
  const serialOutput = execCommand(
    `openssl x509 -in ${nodeDir}/node.crt -noout -serial`,
    true
  );
  const serial = serialOutput.trim().split("=")[1];

  // Extract certificate fingerprint
  const fingerprintOutput = execCommand(
    `openssl x509 -in ${nodeDir}/node.crt -noout -fingerprint -sha256`,
    true
  );
  const fingerprint = fingerprintOutput.trim().split("=")[1];

  // Verify certificate
  execCommand(
    `openssl verify -CAfile ${CA_DIR}/ca.crt ${nodeDir}/node.crt`,
    true
  );

  success(`Generated certificate for ${nodeName} (serial: 0x${serial})`);

  return { serial, fingerprint };
}

// Generate all node certificates
async function generateAllCertificates(members: any[]): Promise<Map<string, any>> {
  section("Generating Node Certificates");

  const certData = new Map<string, any>();

  for (const member of members) {
    const nodeName = member.x500Name
      .match(/CN=([^,]+)/)?.[1]
      ?.toLowerCase()
      .replace(/\s+/g, "-") || `node-${member.memberAddress.slice(2, 8)}`;

    const { serial, fingerprint } = await generateNodeCertificate(member, nodeName);

    certData.set(member.memberAddress, {
      nodeName,
      serial: `0x${serial}`,
      fingerprint,
      x500Name: member.x500Name,
      certPath: path.join(CERTS_DIR, nodeName, "node.crt"),
      keyPath: path.join(CERTS_DIR, nodeName, "node.key")
    });
  }

  success(`Generated ${certData.size} node certificates`);
  return certData;
}

// Register members in NetworkManager contract
async function registerMembers(
  members: any[],
  certData: Map<string, any>
): Promise<void> {
  section("Registering Members in NetworkManager Contract");

  // Find deployed contract
  const ignitionDeploymentsDir = path.join(__dirname, "..", "ignition", "deployments");
  
  if (!fs.existsSync(ignitionDeploymentsDir)) {
    error("Ignition deployments directory not found!");
    throw new Error("Contract not deployed. Run 'npm run deploy' first.");
  }

  const chainDirs = fs.readdirSync(ignitionDeploymentsDir)
    .filter(f => fs.statSync(path.join(ignitionDeploymentsDir, f)).isDirectory())
    .filter(f => f.startsWith("chain-"));

  if (chainDirs.length === 0) {
    error("No chain deployments found!");
    throw new Error("Contract not deployed. Run 'npm run deploy' first.");
  }

  const sortedChainDirs = chainDirs
    .map(dir => ({
      name: dir,
      time: fs.statSync(path.join(ignitionDeploymentsDir, dir)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  const latestChainDir = path.join(ignitionDeploymentsDir, sortedChainDirs[0].name);
  const deployedAddressesPath = path.join(latestChainDir, "deployed_addresses.json");

  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
  const networkManagerKey = Object.keys(deployedAddresses).find(key => 
    key.includes("NetworkManager")
  );

  if (!networkManagerKey) {
    error("NetworkManager contract not found in deployment!");
    throw new Error("NetworkManager not deployed");
  }

  const contractAddress = deployedAddresses[networkManagerKey];
  info(`Found NetworkManager at: ${contractAddress}`);

  // Load contract ABI
  const artifactsPath = path.join(latestChainDir, "artifacts", `${networkManagerKey}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));

  // Setup viem clients
  const rpcUrl = process.env.SUBNET_URL || "http://127.0.0.1:8545";
  const privateKey = process.env.SUBNET_PK || 
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  const publicClient = createPublicClient({
    transport: http(rpcUrl)
  });

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl)
  });

  const networkManager = getContract({
    address: contractAddress as `0x${string}`,
    abi: artifact.abi,
    client: { public: publicClient, wallet: walletClient }
  });

  info(`Registering ${members.length} members...`);

  const registeredMembers: any[] = [];
  let successCount = 0;
  let skipCount = 0;

  for (const member of members) {
    const certInfo = certData.get(member.memberAddress);
    
    if (!certInfo) {
      warn(`No certificate found for ${member.memberAddress}, skipping...`);
      continue;
    }

    try {
      // Check if member already exists
      const isMember = await networkManager.read.isMember([
        member.memberAddress as `0x${string}`
      ]);

      if (isMember) {
        info(`Member ${member.memberAddress} already registered, skipping...`);
        skipCount++;
        continue;
      }

      // Register member
      info(`Adding member: ${certInfo.nodeName}...`);
      
      const hash = await networkManager.write.addMember([
        member.memberAddress as `0x${string}`,
        member.x500Name,
        certInfo.serial as `0x${string}`,
        BigInt(member.platformVersion),
        member.host,
        BigInt(member.port)
      ]);

      await publicClient.waitForTransactionReceipt({ hash });
      
      success(`Registered ${certInfo.nodeName} (tx: ${hash.slice(0, 10)}...)`);
      
      registeredMembers.push({
        address: member.memberAddress,
        nodeName: certInfo.nodeName,
        x500Name: member.x500Name,
        serial: certInfo.serial,
        transactionHash: hash
      });
      
      successCount++;
    } catch (err: any) {
      error(`Failed to register ${member.memberAddress}: ${err.message}`);
    }
  }

  success(`Registration complete: ${successCount} added, ${skipCount} skipped`);
  
  // Save registration report
  const reportPath = path.join(OUTPUT_DIR, "registration-report.json");
  fs.writeJsonSync(reportPath, {
    timestamp: new Date().toISOString(),
    contractAddress,
    totalMembers: members.length,
    registered: successCount,
    skipped: skipCount,
    members: registeredMembers
  }, { spaces: 2 });
  
  success(`Registration report saved to: ${reportPath}`);
}

// Generate certificate summary
async function generateSummary(
  members: any[],
  certData: Map<string, any>
): Promise<void> {
  section("Generating Summary Reports");

  // Certificate summary JSON
  const certSummary: any[] = [];
  
  for (const member of members) {
    const certInfo = certData.get(member.memberAddress);
    if (certInfo) {
      certSummary.push({
        memberAddress: member.memberAddress,
        nodeName: certInfo.nodeName,
        x500Name: certInfo.x500Name,
        certSerial: certInfo.serial,
        fingerprint: certInfo.fingerprint,
        host: member.host,
        port: member.port,
        platformVersion: member.platformVersion,
        certificatePath: path.relative(BOOTSTRAP_DIR, certInfo.certPath),
        privateKeyPath: path.relative(BOOTSTRAP_DIR, certInfo.keyPath)
      });
    }
  }

  const certSummaryPath = path.join(OUTPUT_DIR, "certificate-summary.json");
  fs.writeJsonSync(certSummaryPath, {
    timestamp: new Date().toISOString(),
    totalCertificates: certSummary.length,
    caPath: path.relative(BOOTSTRAP_DIR, path.join(CA_DIR, "ca.crt")),
    certificates: certSummary
  }, { spaces: 2 });
  
  success(`Certificate summary saved to: ${certSummaryPath}`);

  // Human-readable summary
  let textSummary = `
═══════════════════════════════════════════════════════════════
  XDC SUBNET PKI BOOTSTRAP SUMMARY
═══════════════════════════════════════════════════════════════

Timestamp: ${new Date().toISOString()}
Total Members: ${members.length}
Total Certificates: ${certSummary.length}

ROOT CA INFORMATION
─────────────────────────────────────────────────────────────
Location: ${path.relative(BOOTSTRAP_DIR, path.join(CA_DIR, "ca.crt"))}
Private Key: ${path.relative(BOOTSTRAP_DIR, path.join(CA_DIR, "ca.key"))}

IMPORTANT: Keep the CA private key secure and backed up!

NODE CERTIFICATES
─────────────────────────────────────────────────────────────
`;

  for (const cert of certSummary) {
    textSummary += `
${cert.nodeName}
  Address:     ${cert.memberAddress}
  X500 Name:   ${cert.x500Name}
  Serial:      ${cert.certSerial}
  Fingerprint: ${cert.fingerprint}
  Network:     ${cert.host}:${cert.port}
  Certificate: ${cert.certificatePath}
  Private Key: ${cert.privateKeyPath}
`;
  }

  textSummary += `
═══════════════════════════════════════════════════════════════
  NEXT STEPS
═══════════════════════════════════════════════════════════════

1. Verify the setup:
   npm run bootstrap:verify

2. Distribute certificates to nodes:
   - Copy the CA certificate (ca.crt) to all nodes
   - Copy individual node certificates and keys to respective nodes

3. Configure nodes to use mTLS:
   - Update node configuration with certificate paths
   - Enable TLS verification in node settings

4. Monitor contract events:
   - Use the interaction script to query member status
   - Watch for MemberAdded/MemberRemoved events

For detailed instructions, see: bootstrap/README.md

═══════════════════════════════════════════════════════════════
`;

  const summaryPath = path.join(OUTPUT_DIR, "BOOTSTRAP-SUMMARY.txt");
  fs.writeFileSync(summaryPath, textSummary);
  success(`Summary report saved to: ${summaryPath}`);

  console.log(textSummary);
}

// Main bootstrap function
async function main() {
  console.clear();
  section("XDC SUBNET PKI BOOTSTRAP");

  try {
    // Check prerequisites
    info("Checking prerequisites...");
    
    if (!checkOpenSSL()) {
      error("OpenSSL not found! Please install OpenSSL to continue.");
      process.exit(1);
    }
    success("OpenSSL found");

    if (!fs.existsSync(MEMBERS_FILE)) {
      error(`Members file not found: ${MEMBERS_FILE}`);
      process.exit(1);
    }
    success("Members file found");

    // Load members data
    const membersData = fs.readJsonSync(MEMBERS_FILE);
    const members = membersData.members;
    info(`Loaded ${members.length} members from configuration`);

    // Ensure output directories exist
    fs.ensureDirSync(OUTPUT_DIR);
    fs.ensureDirSync(CA_DIR);
    fs.ensureDirSync(CERTS_DIR);
    fs.ensureDirSync(LOGS_DIR);

    // Execute bootstrap steps
    await setupRootCA();
    const certData = await generateAllCertificates(members);
    await registerMembers(members, certData);
    await generateSummary(members, certData);

    section("Bootstrap Complete!");
    success("All tasks completed successfully");
    info(`Log file: ${logFile}`);

  } catch (err: any) {
    error(`Bootstrap failed: ${err.message}`);
    error(`See log file for details: ${logFile}`);
    process.exit(1);
  }
}

// Run main function
main()
  .then(() => process.exit(0))
  .catch((err) => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
