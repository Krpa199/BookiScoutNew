#!/usr/bin/env bash
# One-shot setup script for a fresh DigitalOcean Droplet (Ubuntu 24.04 LTS).
#
# Usage (run as root after SSH-ing into the new Droplet):
#   curl -fsSL https://raw.githubusercontent.com/Krpa199/BookiScoutNew/main/deploy/setup-droplet.sh | bash
#
# Or copy this file to /root/setup-droplet.sh and run: bash setup-droplet.sh

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Sanity checks
# ─────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    echo "❌ Must run as root. Use: sudo bash $0"
    exit 1
fi

echo "🚀 BookiScout Droplet setup starting..."
echo "   This takes ~5 minutes."

# ─────────────────────────────────────────────────────────────
# 1. System update + essential packages
# ─────────────────────────────────────────────────────────────
echo "📦 Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

apt-get install -y -qq \
    ca-certificates \
    curl \
    gnupg \
    ufw \
    fail2ban \
    unattended-upgrades \
    htop \
    vim \
    git

# ─────────────────────────────────────────────────────────────
# 2. Docker Engine + Compose plugin
# ─────────────────────────────────────────────────────────────
echo "🐳 Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list

apt-get update -qq
apt-get install -y -qq \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

systemctl enable --now docker

# ─────────────────────────────────────────────────────────────
# 3. Firewall — only allow SSH + HTTP + HTTPS
# ─────────────────────────────────────────────────────────────
echo "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Caddy auto-redirects to HTTPS)'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3'
ufw --force enable

# ─────────────────────────────────────────────────────────────
# 4. Fail2ban — block brute-force SSH attempts
# ─────────────────────────────────────────────────────────────
echo "🛡️  Enabling fail2ban..."
systemctl enable --now fail2ban

# ─────────────────────────────────────────────────────────────
# 5. Unattended security upgrades
# ─────────────────────────────────────────────────────────────
echo "🔄 Enabling automatic security upgrades..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# ─────────────────────────────────────────────────────────────
# 6. Deploy user (non-root) for GitHub Actions SSH
# ─────────────────────────────────────────────────────────────
echo "👤 Creating deploy user..."
if ! id -u deploy &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    mkdir -p /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chown -R deploy:deploy /home/deploy/.ssh
fi

# ─────────────────────────────────────────────────────────────
# 7. App directory
# ─────────────────────────────────────────────────────────────
echo "📁 Creating app directory..."
mkdir -p /opt/bookiscout
chown deploy:deploy /opt/bookiscout

# ─────────────────────────────────────────────────────────────
# 8. Swap file (1 GB RAM is tight — add 2 GB swap as safety)
# ─────────────────────────────────────────────────────────────
if [[ ! -f /swapfile ]]; then
    echo "💾 Creating 2 GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Reduce swappiness — only use swap when really needed
    echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
    sysctl -p /etc/sysctl.d/99-swappiness.conf
fi

# ─────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────
echo ""
echo "✅ Droplet setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add your GitHub Actions deploy key to /home/deploy/.ssh/authorized_keys"
echo "  2. Copy deploy/docker-compose.prod.yml + Caddyfile to /opt/bookiscout/"
echo "  3. Create /opt/bookiscout/.env.production with secrets"
echo "  4. Run: cd /opt/bookiscout && docker compose up -d"
echo ""
echo "Server IP: $(curl -s ifconfig.me)"
echo "Docker version: $(docker --version)"
