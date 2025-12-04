# Security Configuration Guide

This document provides instructions for securely setting up the XDC Subnet-Deployment project without exposing sensitive information.

## Sensitive Data Protection

This project requires various private keys, API keys, and contract addresses to function properly. **Never commit these sensitive values to Git**.

### Configuration Files Setup

1. **Contracts Environment File**

   Copy the example file and fill in your actual values:

   ```bash
   # For contract deployment
   cd contracts
   cp ".env example" .env
   ```

2. **Frontend Environment File**

   Copy the example file and fill in your actual values:

   ```bash
   # For frontend configuration
   cd frontend
   cp .env.example .env
   ```

3. **Private Keys**

   Edit the environment files and add your actual private keys:

   ```
   # In contracts/.env
   PARENTNET_PK=your_actual_parentnet_private_key
   SUBNET_PK=your_actual_subnet_private_key
   ```

4. **Contract Addresses**

   After deploying contracts, update the addresses in the configuration files as needed.

### Security Best Practices

1. **Use .gitignore**

   The project's `.gitignore` file is configured to exclude sensitive files, but always verify that your sensitive files are properly excluded before committing:

   ```bash
   git status
   ```

2. **Use Environment Variables in Production**

   For production deployments, consider using environment variables instead of config files:

   ```bash
   # Example for setting environment variables
   export SUBNET_PK=your_actual_subnet_private_key
   ```

3. **Regular Key Rotation**

   Periodically rotate your private keys, especially if you suspect they may have been compromised.

4. **Access Control**

   Limit access to production environments and sensitive keys to only those who absolutely need it.

## Cleaning Sensitive Data from Git History

If you accidentally committed sensitive data, follow these steps to remove it:

1. Install BFG Repo-Cleaner:

   ```bash
   # On macOS with Homebrew
   brew install bfg
   
   # Or download directly
   # https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. Clone a fresh copy of your repository (mirror):

   ```bash
   git clone --mirror git://example.com/my-repo.git
   ```

3. Use BFG to remove sensitive data:

   ```bash
   bfg --delete-files contract_deploy.env my-repo.git
   ```

4. Clean up and push changes:

   ```bash
   cd my-repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push
   ```

5. Notify team members to re-clone the repository.

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by opening a GitHub Security Advisory at:

https://github.com/AnthonyQuy/XDC-Subnet-POC/security/advisories

Alternatively, you can email the repository maintainers directly (check repository for contact information).

**Do NOT report security vulnerabilities through public GitHub issues.**
