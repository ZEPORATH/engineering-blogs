# Setting up HomeLab

## Overview

This is a documentation of my journey setting up a homelab on a veteran ThinkPad laptop (4th Gen Intel i7 with Kepler NVIDIA GPU) running Ubuntu Server. The goal was to create a self-hosted infrastructure for photo management, system monitoring, CI/CD pipelines, and local cloud development - all accessible remotely via Tailscale.

![Homelab Setup Overview](./images/homelab-overview.jpg)
*Photo placeholder: Overall homelab physical setup*

## Hardware Specifications

### Legacy Laptop as Server
- **Model**: W451 (circa 2013-2014)
- **CPU**: Intel i7 4th Gen (Haswell) - "Let it rip" 🔥
- **GPU**: NVIDIA Kepler (Quadro K1100M/similar)
- **RAM**: 28GB DDR3
- **Storage**: 
  - 500GB SSD (System drive)
  - 2TB External HDD (Media storage at `/media/2tb_external/mypics/`)

![Laptop Server](./images/laptop-server.jpg)
*Photo placeholder: The veteran W451 in action*

### Why a Laptop?
- **Built-in UPS**: The battery acts as an uninterruptible power supply
- **Compact form factor**: Minimal space requirement
- **Integrated peripherals**: Display, keyboard for emergency access
- **Cost-effective**: Repurposing existing hardware

## Operating System Setup

### Ubuntu Server Installation
- Fresh installation of Ubuntu Server (24.04 LTS)
- Wiped previous Windows/Ubuntu Desktop dual-boot setup
- Initially only used ~97GB of 500GB SSD due to conservative installer

#### Disk Space Reclamation
Had to expand the LVM logical volume to use full SSD capacity:

```bash
# Check volume group free space
sudo vgs

# Expand logical volume to use all free space
sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv

# Grow the filesystem
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv

# Verify
df -h /
```

Result: Went from ~97GB to ~440GB available space.

![Storage Before/After](./images/storage-expansion.jpg)
*Photo placeholder: Terminal showing disk space before and after*

### Lid-Closed Operation

Since this laptop runs as a headless server with the lid closed:

```bash
# Disable lid switch suspend
sudo nano /etc/systemd/logind.conf

# Add these lines:
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore

# Restart login service
sudo systemctl restart systemd-logind

# Disable all sleep modes
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

![Laptop Lid Closed](./images/lid-closed-setup.jpg)
*Photo placeholder: Laptop running with lid closed*

### BIOS Configuration

Entered BIOS to enable:
- **Auto-Power On after Power Loss**: Ensures server restarts after power outages
- **Wake on LAN**: Remote wake capability (optional)

> **Thermal Warning**: Running with lid closed traps heat. Used vertical laptop stand for better airflow.

## Docker Installation

### Removing Snap Docker (The Cursed Setup)

Initial installation used Snap Docker, which caused permission nightmares:
- Two Docker daemons running simultaneously
- `docker` CLI couldn't control Portainer-managed containers
- Permission denied errors even with `sudo`

```bash
# Stop and remove Snap Docker
sudo snap stop docker
sudo snap remove docker

# Clean leftover junk
sudo rm -rf /var/snap/docker /run/snap.docker ~/.docker

# Verify no dockerd running
ps -ef | grep dockerd | grep -v grep
```

![Docker Permission Issues](./images/docker-permission-error.jpg)
*Photo placeholder: Terminal showing permission denied errors*

### Installing Docker via APT (The Right Way)

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Docker using official script
curl -fsSL https://get.docker.com | sudo sh

# Enable Docker at boot
sudo systemctl enable --now docker

# Add user to docker group (no more sudo!)
sudo usermod -aG docker $USER

# Log out and back in for group changes to apply
```

Verification:
```bash
docker version
docker ps
```

![Docker Clean Install](./images/docker-apt-install.jpg)
*Photo placeholder: Successful docker version output*

## Container Management

### Portainer Setup

Headless Portainer installation for container management:

```bash
# Create volume for persistent data
docker volume create portainer_data

# Run Portainer
docker run -d \
  --name portainer \
  --restart=always \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

Access: `https://<yourip>:9443`

![Portainer Dashboard](./images/portainer-dashboard.jpg)
*Photo placeholder: Portainer web interface*

## Network Access

### Tailscale Integration

All homelab services are accessed securely over Tailscale VPN - this is where the magic happens!

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
sudo tailscale up

# Check status
tailscale status
```

**The Tailscale Charm**: 
The absolute game-changer for this homelab setup. I can access my entire infrastructure from my office, using just my phone, without any VPN configuration headaches, port forwarding nightmares, or security paranoia. Open the Tailscale app, and instantly my homelab is accessible as if I'm on the same network. Browsing photos during lunch break, checking system metrics, or deploying code - all seamless.

**Benefits**:
- Secure remote access from **anywhere** (office, coffee shop, abroad)
- Zero router configuration (no port forwarding!)
- Access homelab services using Tailscale IPs or hostnames
- End-to-end encrypted WireGuard VPN
- Works behind corporate firewalls and NATs
- Phone, laptop, tablet - all just work

**Example Usage**:
```
Office (on phone) → Open Tailscale app → Open browser
→ http://<your-tailscale-ip>:3000 (Homepage)
→ Click PhotoPrism → Browse family photos
```

No complexity. No IT tickets. Just access.

![Tailscale Setup](./images/tailscale-status.jpg)
*Photo placeholder: Tailscale status showing connected devices*

### Homepage Dashboard

Centralized dashboard for all homelab services:

```bash
mkdir -p ~/homepage
cd ~/homepage
```

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    container_name: homepage
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - HOMEPAGE_ALLOWED_HOSTS=*
```

Configuration files in `config/`:

**settings.yaml**:
```yaml
title: "Shashank's Homelab"
subtitle: "Self-hosted Infrastructure"
theme: dark
color: slate
```

**services.yaml**:
```yaml
- Media:
    - PhotoPrism:
        icon: photoprism
        href: http://<yourpcname>:2342
        description: Photo Management

- Infrastructure:
    - Portainer:
        icon: portainer
        href: https://<yourpcname>:9443
        description: Container Management
    
    - Beszel:
        icon: beszel
        href: http://<yourpcname>:8090
        description: System Monitoring

- Development:
    - LocalStack:
        icon: aws
        href: http://<yourpcname>:4566
        description: Local AWS Cloud
```

Replace `<yourpcname>` with your server's hostname or Tailscale IP address.

![Homepage Dashboard](./images/homepage-dashboard.jpg)
*Photo placeholder: Homepage showing all services*

## Web Terminal Access

Deployed WeTTY for browser-based terminal access:

```bash
docker run --rm -it -p 2678:3000 wettyoss/wetty --ssh-host=172.17.0.1
```

Accessible via: `http://<yourpcname>:2678/wetty`

![Web Terminal](./images/wetty-terminal.jpg)
*Photo placeholder: WeTTY web terminal in browser*

## Thermal Management

### CPU Governor Tuning

The 4th gen i7 runs hot. Used power management to control thermals:

```bash
# Check current governor
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Switch to powersave mode
echo "powersave" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### Sensor Monitoring

```bash
# Install sensor tools
sudo apt install lm-sensors
sudo sensors-detect  # Say YES to everything

# Check temperatures
sensors
```

![Temperature Monitoring](./images/temperature-sensors.jpg)
*Photo placeholder: Sensor output showing CPU/GPU temps*

### Physical Cooling Improvements

- **Vertical laptop stand**: Improves airflow dramatically
- **Planned repaste**: Thermal paste replacement scheduled (10+ year old paste is crusty)
- **Avoided heavy ML workloads**: Limited Immich/PhotoPrism worker threads

## Directory Structure

```
~/
├── homelab/
│   ├── homepage/
│   │   ├── docker-compose.yml
│   │   └── config/
│   ├── photoprism/
│   │   ├── docker-compose.yml
│   │   ├── storage/
│   │   └── db/
│   └── portainer/
└── immich/ (deprecated, moved to PhotoPrism)

/media/2tb_external/
└── mypics/
    ├── VacationPhotos/
    ├── phone_sync/
    └── ...
```

## External Storage Configuration

### 2TB HDD Mount

Permanently mounted external drive for media storage:

```bash
# Check drive location
lsblk

# Set correct permissions
sudo chmod -R a+rX /media/2tb_external/mypics
```

![External Drive Setup](./images/external-hdd-mount.jpg)
*Photo placeholder: lsblk output showing drive mounts*

## Next Steps

With the foundation in place, the next phases covered:
- Photo management solution (PhotoPrism)
- System monitoring (Beszel, Netdata)
- CI/CD pipeline (k3s, LocalStack, GitHub runners)
- Backup strategies

See the following sections for details on each component.
