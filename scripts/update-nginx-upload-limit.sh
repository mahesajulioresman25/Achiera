#!/bin/bash

# Script to update Nginx upload limit to 20MB
# Run this on the server: bash update-nginx-upload-limit.sh

echo "========================================="
echo "Nginx Upload Limit Configuration Update"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backing up current Nginx configuration...${NC}"
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking current configuration...${NC}"
if grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    echo -e "${YELLOW}Found existing client_max_body_size setting${NC}"
    grep "client_max_body_size" /etc/nginx/nginx.conf
else
    echo -e "${YELLOW}No existing client_max_body_size setting found${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Updating Nginx configuration...${NC}"

# Check if the setting already exists in http block
if grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    # Update existing setting
    sed -i 's/client_max_body_size [0-9]*[MmGgKk];/client_max_body_size 20M;/g' /etc/nginx/nginx.conf
    echo -e "${GREEN}✓ Updated existing client_max_body_size to 20M${NC}"
else
    # Add new setting to http block
    sed -i '/http {/a \    client_max_body_size 20M;' /etc/nginx/nginx.conf
    echo -e "${GREEN}✓ Added client_max_body_size 20M to http block${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Testing Nginx configuration...${NC}"
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✓ Nginx configuration test passed${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed!${NC}"
    echo -e "${YELLOW}Restoring backup...${NC}"
    cp /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/nginx.conf
    echo -e "${RED}Configuration restored. Please check manually.${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Reloading Nginx...${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}✗ Failed to reload Nginx${NC}"
    echo -e "${YELLOW}Trying restart instead...${NC}"
    systemctl restart nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Nginx restarted successfully${NC}"
    else
        echo -e "${RED}✗ Failed to restart Nginx${NC}"
        exit 1
    fi
fi
echo ""

echo -e "${YELLOW}Step 6: Verifying configuration...${NC}"
nginx -T 2>/dev/null | grep "client_max_body_size"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Configuration Update Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${GREEN}Upload limit is now set to: 20MB${NC}"
echo -e "${YELLOW}Please test by uploading a file > 2MB in the dashboard${NC}"
echo ""
