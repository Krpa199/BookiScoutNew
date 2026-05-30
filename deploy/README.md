# BookiScout Droplet Deployment

End-to-end deploy guide for self-hosted Next.js on DigitalOcean Droplet.

## Architecture

```
GitHub push  →  GitHub Actions builds Docker image  →  pushes to GHCR
                                                              ↓
                                                       SSH to Droplet
                                                              ↓
                                              docker pull + restart bookiscout
                                                              ↓
                                            Caddy reverse proxy + auto-SSL
                                                              ↓
                                            Cloudflare CDN (caches HTML)
                                                              ↓
                                                          Users
```

## One-time setup

### 1. Create Droplet

- DigitalOcean → Create → Droplets
- **Image:** Ubuntu 24.04 LTS
- **Plan:** Basic / Regular SSD / **$6 / 1 GB RAM / 1 vCPU / 25 GB SSD**
- **Region:** Frankfurt (FRA1)
- **Authentication:** SSH key (paste your `~/.ssh/id_ed25519.pub`)
- **Hostname:** `bookiscout-prod`
- Click **Create Droplet**, copy the public IP.

### 2. Initial Droplet setup

SSH in as root:

```bash
ssh root@<DROPLET_IP>
```

Run the setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/Krpa199/BookiScoutNew/main/deploy/setup-droplet.sh | bash
```

This installs Docker, configures firewall, creates `deploy` user, adds swap.

### 3. Add GitHub Actions deploy key

On your local machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/bookiscout_deploy -C "github-actions-deploy"
```

Copy the public key to the Droplet:

```bash
ssh root@<DROPLET_IP> "cat >> /home/deploy/.ssh/authorized_keys" < ~/.ssh/bookiscout_deploy.pub
```

Add to GitHub repo secrets (Settings → Secrets and variables → Actions):

| Secret name | Value |
|---|---|
| `DROPLET_HOST` | The Droplet's public IP |
| `DROPLET_SSH_KEY` | Contents of `~/.ssh/bookiscout_deploy` (the PRIVATE key) |
| `GHCR_PULL_TOKEN` | A GitHub PAT with `read:packages` scope |

### 4. Copy compose + Caddy config to Droplet

```bash
scp deploy/docker-compose.prod.yml deploy@<DROPLET_IP>:/opt/bookiscout/docker-compose.yml
scp deploy/Caddyfile deploy@<DROPLET_IP>:/opt/bookiscout/Caddyfile
```

### 5. Create env file on Droplet

```bash
ssh deploy@<DROPLET_IP>
cd /opt/bookiscout
nano .env.production  # paste content from deploy/env.production.example, fill values
chmod 600 .env.production
```

### 6. First deploy

Trigger the GitHub Actions workflow:

```bash
gh workflow run deploy-droplet.yml
```

Watch progress at: https://github.com/Krpa199/BookiScoutNew/actions

### 7. Cloudflare DNS

- Add `bookiscout.com` to Cloudflare (free plan).
- Create A record: `cf.bookiscout.com` → `<DROPLET_IP>` (proxied — orange cloud ON).
- Once tested, change the apex `bookiscout.com` A record from Vercel's IP to `<DROPLET_IP>`.

## Day-to-day operations

### Deploy a new version
Just push to `main` — GitHub Actions does the rest.

### Manual deploy
```bash
gh workflow run deploy-droplet.yml
```

### View logs
```bash
ssh deploy@<DROPLET_IP> 'docker logs bookiscout --tail 100 -f'
```

### Rollback
```bash
ssh deploy@<DROPLET_IP>
cd /opt/bookiscout
docker pull ghcr.io/krpa199/bookiscoutnew:sha-<previous-sha>
docker tag ghcr.io/krpa199/bookiscoutnew:sha-<previous-sha> ghcr.io/krpa199/bookiscoutnew:latest
docker compose up -d --no-deps bookiscout
```

### Restart Caddy (after Caddyfile edit)
```bash
ssh deploy@<DROPLET_IP> 'cd /opt/bookiscout && docker compose restart caddy'
```

### Server health
```bash
ssh deploy@<DROPLET_IP> 'docker ps && free -h && df -h /'
```

### Monthly maintenance (5 min)
```bash
ssh root@<DROPLET_IP>
apt update && apt upgrade -y
docker system prune -f  # clean old images
reboot  # if kernel updated
```
