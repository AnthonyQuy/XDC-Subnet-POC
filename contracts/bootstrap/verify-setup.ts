#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createPublicClient, http, getContract } from "viem";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "output");
const CA_DIR = path.join(OUTPUT_DIR, "ca");
const CERTS_DIR = path.join(OUTPUT_DIR, "certs");

// Colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m"
};

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function fail(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function warn(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function section(msg: string) {
  console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`);
  console.log("─".repeat(60));
}

async function verifyCASetup(): Promise<boolean> {
  section("Verifying Root CA Setup");
  
  let allGood = true;

  // Check CA certificate exists
  const caCertPath = path.join(CA_DIR, "ca.crt");
  if (fs.existsSync(caCertPath)) {
    success("CA certificate exists");
    
    try {
      // Verify CA certificate is valid
      execSync(`openssl x509 -in ${caCertPath} -noout -text`, { stdio: "pipe" });
      success("CA certificate is valid");
      
      // Check CA is self-signed
      const verify = execSync(`openssl verify -CAfile ${caCertPath} ${caCertPath}`, { 
        encoding: "utf8",
        stdio: "pipe"
      });
      
      if (verify.includes("OK")) {
        success("CA certificate is self-signed");
      } else {
        fail("CA certificate verification failed");
        allGood = false;
      }
      
      // Display CA info
      const subject = execSync(`openssl x509 -in ${caCertPath} -noout -subject`, {
        encoding: "utf8",
        stdio: "pipe"
      }).trim();
      const dates = execSync(`openssl x509 -in ${caCertPath} -noout -dates`, {
        encoding: "utf8",
        stdio: "pipe"
      }).trim();
      
      info(`  ${subject}`);
      info(`  ${dates.split("\n")[0]}`);
      info(`  ${dates.split("\n")[1]}`);
      
    } catch (err) {
      fail("CA certificate validation failed");
      allGood = false;
    }
  } else {
    fail("CA certificate not found");
    allGood = false;
  }

  // Check CA private key exists
  const caKeyPath = path.join(CA_DIR, "ca.key");
  if (fs.existsSync(caKeyPath)) {
    success("CA private key exists");
  } else {
    fail("CA private key not found");
    allGood = false;
  }

  return allGood;
}

async function verifyNodeCertificates(): Promise<boolean> {
  section("Verifying Node Certificates");
  
  let allGood = true;

  if (!fs.existsSync(CERTS_DIR)) {
    fail("Certificates directory not found");
    return false;
  }

  const nodeDirs = fs.readdirSync(CERTS_DIR)
    .filter(f => fs.statSync(path.join(CERTS_DIR, f)).isDirectory());

  if (nodeDirs.length === 0) {
    fail("No node certificates found");
    return false;
  }

  info(`Found ${nodeDirs.length} node certificate directories\n`);

  const caCertPath = path.join(CA_DIR, "ca.crt");

  for (const nodeDir of nodeDirs) {
    const nodePath = path.join(CERTS_DIR, nodeDir);
    const certPath = path.join(nodePath, "node.crt");
    const keyPath = path.join(nodePath, "node.key");

    console.log(`${colors.cyan}${nodeDir}${colors.reset}`);

    // Check certificate exists
    if (!fs.existsSync(certPath)) {
      fail(`  Certificate not found`);
      allGood = false;
      continue;
    }

    // Check private key exists
    if (!fs.existsSync(keyPath)) {
      fail(`  Private key not found`);
      allGood = false;
      continue;
    }

    try {
      // Verify certificate with CA
      const verify = execSync(`openssl verify -CAfile ${caCertPath} ${certPath}`, {
        encoding: "utf8",
        stdio: "pipe"
      });

      if (verify.includes("OK")) {
        success(`  Certificate verified against CA`);
      } else {
        fail(`  Certificate verification failed`);
        allGood = false;
        continue;
      }

      // Get certificate details
      const subject = execSync(`openssl x509 -in ${certPath} -noout -subject`, {
        encoding: "utf8",
        stdio: "pipe"
      }).trim();

      const serial = execSync(`openssl x509 -in ${certPath} -noout -serial`, {
        encoding: "utf8",
        stdio: "pipe"
      }).trim().split("=")[1];

      const enddate = execSync(`openssl x509 -in ${certPath} -noout -enddate`, {
        encoding: "utf8",
        stdio: "pipe"
      }).trim().split("=")[1];

      info(`  ${subject}`);
      info(`  Serial: 0x${serial}`);
      info(`  Expires: ${enddate}`);

      // Check if certificate has expired
      const expiryDate = new Date(enddate);
      const now = new Date();
      
      if (expiryDate < now) {
        fail(`  Certificate has EXPIRED`);
        allGood = false;
      } else {
        const daysLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 30) {
          warn(`  Certificate expires in ${daysLeft} days`);
        } else {
          success(`  Certificate valid for ${daysLeft} days`);
        }
      }

    } catch (err: any) {
      fail(`  Verification error: ${err.message}`);
      allGood = false;
    }

    console.log();
  }

  return allGood;
}

async function verifyContractRegistration(): Promise<boolean> {
  section("Verifying Contract Registration");
  
  try {
    // Find deployed contract
    const ignitionDeploymentsDir = path.join(__dirname, "..", "ignition", "deployments");
    
    if (!fs.existsSync(ignitionDeploymentsDir)) {
      fail("Ignition deployments directory not found");
      return false;
    }

    const chainDirs = fs.readdirSync(ignitionDeploymentsDir)
      .filter(f => fs.statSync(path.join(ignitionDeploymentsDir, f)).isDirectory())
      .filter(f => f.startsWith("chain-"));

    if (chainDirs.length === 0) {
      fail("No chain deployments found");
      return false;
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
      fail("NetworkManager contract not found in deployment");
      return false;
    }

    const contractAddress = deployedAddresses[networkManagerKey];
    success(`Found NetworkManager at: ${contractAddress}`);

    // Load contract ABI
    const artifactsPath = path.join(latestChainDir, "artifacts", `${networkManagerKey}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));

    // Setup client
    const rpcUrl = process.env.SUBNET_URL || "http://192.168.25.11:8545";
    
    const publicClient = createPublicClient({
      transport: http(rpcUrl)
    });

    const networkManager = getContract({
      address: contractAddress as `0x${string}`,
      abi: artifact.abi,
      client: publicClient
    });

    // Get all members
    const memberAddresses = await networkManager.read.getAllMembers([]) as `0x${string}`[];
    success(`Found ${memberAddresses.length} registered members\n`);

    // Check each member
    for (const address of memberAddresses) {
      const member = await networkManager.read.getMember([address]) as any;
      
      console.log(`${colors.cyan}${address}${colors.reset}`);
      info(`  X500 Name: ${member.x500Name}`);
      info(`  Host: ${member.host}:${member.port}`);
      info(`  Platform: v${member.platformVersion}`);
      info(`  Status: ${member.isActive ? colors.green + "Active" + colors.reset : colors.red + "Inactive" + colors.reset}`);
      info(`  Joined: ${new Date(Number(member.joinedAt) * 1000).toLocaleString()}`);
      console.log();
    }

    return true;

  } catch (err: any) {
    fail(`Contract verification failed: ${err.message}`);
    return false;
  }
}

async function checkReports(): Promise<void> {
  section("Checking Reports");

  const summaryPath = path.join(OUTPUT_DIR, "BOOTSTRAP-SUMMARY.txt");
  if (fs.existsSync(summaryPath)) {
    success("Bootstrap summary exists");
  } else {
    warn("Bootstrap summary not found");
  }

  const certSummaryPath = path.join(OUTPUT_DIR, "certificate-summary.json");
  if (fs.existsSync(certSummaryPath)) {
    success("Certificate summary exists");
    const summary = fs.readJsonSync(certSummaryPath);
    info(`  Certificates: ${summary.totalCertificates}`);
  } else {
    warn("Certificate summary not found");
  }

  const registrationPath = path.join(OUTPUT_DIR, "registration-report.json");
  if (fs.existsSync(registrationPath)) {
    success("Registration report exists");
    const report = fs.readJsonSync(registrationPath);
    info(`  Registered: ${report.registered}`);
    info(`  Skipped: ${report.skipped}`);
  } else {
    warn("Registration report not found");
  }
}

async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}XDC Subnet PKI Verification${colors.reset}\n`);

  const results = {
    ca: await verifyCASetup(),
    certs: await verifyNodeCertificates(),
    contract: await verifyContractRegistration()
  };

  await checkReports();

  // Final summary
  section("Verification Summary");

  if (results.ca && results.certs && results.contract) {
    success("All checks passed! PKI setup is valid.");
    process.exit(0);
  } else {
    fail("Some checks failed. Please review the output above.");
    if (!results.ca) warn("  - Root CA verification failed");
    if (!results.certs) warn("  - Node certificate verification failed");
    if (!results.contract) warn("  - Contract registration verification failed");
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
