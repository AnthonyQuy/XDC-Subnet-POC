#!/bin/bash

# cleanup-pki.sh
# Safely cleanup generated PKI files and certificates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  XDC Subnet PKI Cleanup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"

# Check if output directory exists
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}⚠ Output directory does not exist: ${OUTPUT_DIR}${NC}"
    echo -e "${GREEN}✓ Nothing to clean up${NC}"
    exit 0
fi

# List what will be removed
echo -e "${CYAN}The following will be removed:${NC}"
echo -e "  - CA certificates and keys"
echo -e "  - All node certificates and keys"
echo -e "  - Bootstrap logs"
echo -e "  - Summary reports"
echo ""

# Confirm deletion
read -p "Are you sure you want to delete all PKI files? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "\n${YELLOW}⚠ Cleanup cancelled${NC}"
    exit 0
fi

echo ""

# Backup option
read -p "Do you want to create a backup before cleanup? (yes/no): " BACKUP

if [ "$BACKUP" = "yes" ]; then
    BACKUP_DIR="${SCRIPT_DIR}/backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${CYAN}Creating backup at: ${BACKUP_DIR}${NC}"
    cp -r "$OUTPUT_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup created${NC}\n"
fi

# Remove output directory
echo -e "${CYAN}Removing PKI files...${NC}"

if rm -rf "$OUTPUT_DIR"; then
    echo -e "${GREEN}✓ Successfully removed: ${OUTPUT_DIR}${NC}"
else
    echo -e "${RED}✗ Failed to remove output directory${NC}"
    exit 1
fi

# Recreate empty directory structure
mkdir -p "${OUTPUT_DIR}"/{ca,certs,logs}
echo -e "${GREEN}✓ Recreated empty directory structure${NC}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Cleanup complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n"

if [ "$BACKUP" = "yes" ]; then
    echo -e "${YELLOW}Backup location: ${BACKUP_DIR}${NC}\n"
fi

echo -e "To regenerate PKI files, run:"
echo -e "  ${CYAN}npm run bootstrap${NC}\n"
