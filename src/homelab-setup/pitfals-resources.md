# Pitfalls and Regrets

This section documents the painful lessons, dead ends, and "I should have known better" moments from setting up the homelab. Learning from mistakes is just as valuable as celebrating successes.

## Critical Mistakes

### 1. Snap Docker: The Permission Nightmare

**The Problem**: Initial installation used Ubuntu's Snap package for Docker, which seemed convenient but created an impossible situation.

**Symptoms**:
- Two Docker daemons running simultaneously
- `docker ps` showed different containers than Portainer
- `docker stop` gave "permission denied" **even with sudo**
- Container paths pointing to different locations
- `immich_server` visible in Portainer but "doesn't exist" in CLI

**Root Cause**:
```bash
# Two daemons running at once!
root 2269 ... dockerd --data-root=/var/snap/docker/...  # Snap Docker
root 62983 ... /usr/bin/dockerd -H fd:// ...            # System Docker
```

CLI talked to system Docker, Portainer talked to Snap Docker. They couldn't see each other's containers.

**Why It Happened**: Portainer auto-detected and used Snap Docker's socket at `/run/snap.docker/docker.sock`, while CLI defaulted to `/var/run/docker.sock`.

![Docker Daemon Conflict](./images/docker-daemon-conflict.jpg)
*Photo placeholder: ps output showing two dockerd processes*

**The Fix**: Nuclear option was the only option.
```bash
# Stop and completely remove Snap Docker
sudo snap stop docker
sudo snap remove docker

# Clean all remnants
sudo rm -rf /var/snap/docker /run/snap.docker ~/.docker

# Install proper Docker via apt
curl -fsSL https://get.docker.com | sudo sh
```

**Lesson Learned**: On Ubuntu servers, **always** use apt Docker. Snap is convenient for desktop apps, but cursed for infrastructure.

**Time Lost**: 2 hours of debugging, 30 minutes to fix properly

---

### 2. Immich → PhotoPrism Migration

**The Regret**: Spent significant time setting up Immich, fixing metadata, configuring external libraries, only to realize it fundamentally didn't match the use case.

**What Went Wrong**:
- **Folder Organization**: Immich treats folders as implementation details, not organizational structure
- **Legacy Photos**: 20+ years of organized folders (`/Vacation2010/`, `/India2015/`, etc.) became a chronological soup
- **Folder View**: Technically exists but requires external library setup, still limited
- **Philosophy Mismatch**: Immich wants to be Google Photos (timeline-first), not a file browser

**The Decision Point**:
```
User: "How do I see my VacationPhotos folder in Immich like I can in PhotoPrism?"
Reality: "You create an external library, scan it, then search for it, 
          but it still shows in a timeline mixed with everything else."
```

![Immich Timeline View](./images/immich-timeline-problem.jpg)
*Photo placeholder: Immich showing all photos chronologically, folders buried*

**The Migration**:
1. Stopped all Immich containers
2. Deleted Immich Docker volumes (kept original photos on HDD)
3. Set up PhotoPrism with MariaDB
4. Pointed to same `/media/2tb_external/mypics` location
5. Re-indexed everything (CPU ran hot for 6+ hours)

**What PhotoPrism Did Better**:
- Native folder navigation in sidebar
- Respects existing directory structure
- Can browse by folder OR timeline
- Sidecar files (`.yml`) don't modify originals

**What Was Lost**:
- Excellent mobile app with background sync
- Partner sharing features
- Faster search in some cases

**Time Lost**: 1 full day of Immich setup + metadata fixing, 4 hours migration

**Lesson Learned**: Evaluate the **organization philosophy** before technical features. If you've spent years organizing folders, use software that respects that. Immich is brilliant for phone-first workflows, PhotoPrism for archival.

---

### 3. LVM Disk Space Mystery

**The Problem**: Fresh Ubuntu Server install on a 512GB SSD, but only 97GB available.

**Initial Reaction**: "Did the installer fail? Is there a hidden partition? Where's my storage?!"

**The Reality**:
```bash
sda3      444G   # Physical partition
  └─ubuntu-vg/ubuntu-lv  100G   # Logical volume (not expanded)
```

Ubuntu Server installer created a conservative 100GB logical volume and left 344GB **unused in the volume group**.

![LVM Not Expanded](./images/lvm-unused-space.jpg)
*Photo placeholder: vgs command showing free space in volume group*

**Why This Happens**: Ubuntu Server assumes cloud/VM deployment where you expand storage later. It doesn't auto-expand on bare metal.

**The Fix** (took 2 minutes once understood):
```bash
sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
```

**Time Lost**: 30 minutes of confusion, 2 minutes to fix

**Lesson Learned**: Ubuntu Server's installer is cloud-first. Always check `vgs` and `lvs` after installation to see if LVM needs expansion.

---

### 4. Cockpit Configuration Hell

**The Problem**: Cockpit web UI worked briefly, then started infinite reload loop on the Services page.

**Error**:
```
DuplicateOptionError: option 'listenstream' in section 'Socket' already exists
```

**What Happened**: At some point (likely during troubleshooting), `/etc/cockpit/cockpit.conf` got duplicate entries:

```ini
[Socket]
ListenStream=9090
ListenStream=9090  # Duplicate!
```

Cockpit authenticated successfully, then crashed parsing its own config file.

![Cockpit Crash](./images/cockpit-crash-log.jpg)
*Photo placeholder: journalctl showing DuplicateOptionError*

**The Fix**:
```bash
# Nuclear option: remove the config entirely
sudo mv /etc/cockpit/cockpit.conf /etc/cockpit/cockpit.conf.bak
sudo systemctl restart cockpit
```

Cockpit works fine with no custom config.

**Time Lost**: 1 hour debugging PAM, polkit, systemd... all red herrings

**Lesson Learned**: Check application logs first. The error message was explicit, but I assumed it was an auth issue because the UI showed "login failed."

**Bonus Regret**: Eventually abandoned Cockpit entirely for Portainer + Homepage dashboard.

---

### 5. Metadata Massacre: Google Photos Export

**The Problem**: Downloaded ~10,000 photos from Google Photos. Imported to Immich. Every single photo showed as "Uploaded Today" instead of actual dates.

**Root Cause**: Google Photos exports:
- Strip EXIF metadata from photos
- Put dates in separate `.json` sidecar files
- Name files like `IMG-20231222-WA0013.jpg` with date embedded

Without EXIF data, photo management software falls back to **file creation date** = download date.

![Broken Dates](./images/google-photos-broken-dates.jpg)
*Photo placeholder: Photo timeline showing all photos clustered on one day*

**First Attempt**: Manual date editing in Immich UI (not scalable for 10k photos)

**Second Attempt**: ExifTool with fuzzy parsing (partially worked)

**Final Solution**: Precise ExifTool regex matching the filename pattern:

```bash
# For 14-digit timestamps (20241014094052)
exiftool -if 'not $DateTimeOriginal' \
  '-DateTimeOriginal<${filename;m/(\d{14})/;$_=$1}' \
  -overwrite_original .

# For WhatsApp format (IMG-20231222-WA0013.jpg)
exiftool -if 'not $DateTimeOriginal' \
  '-DateTimeOriginal<${filename;m/(\d{8})/;$_=$1} 12:00:00' \
  -overwrite_original .
```

**Time Lost**: 3 hours researching, 2 hours writing Python script, 1 hour ExifTool fine-tuning, 4+ hours re-indexing

**Lesson Learned**: 
1. Google Photos exports are hostile to self-hosting
2. Always fix metadata **before** importing to gallery software
3. ExifTool is a Swiss Army knife—learn its regex syntax
4. Use `immich-go` tool for proper Google Takeout imports

---

### 6. Netdata CPU Hogging

**Issue**: Installed Netdata for system monitoring. Laptop fan constantly spinning, CPU at 30%+ even when idle.

**Why**: Netdata collects **thousands of metrics every second**, even when no one is viewing the dashboard. On a 4th gen i7 W451 running headless in a closed laptop, this was thermal suicide.

**Symptoms**:
- Idle CPU: 30-40% (normally 5%)
- Temperatures: 75°C idle (normally 50°C)
- htop: `netdata` process always in top 3
- SSD writes: Constant database updates

![Netdata CPU Usage](./images/netdata-cpu-usage.jpg)
*Photo placeholder: htop showing netdata eating CPU*

**The Wrong Fix**: Tried to configure Netdata to reduce metrics collection. Config is complex, results minimal.

**The Right Fix**: Removed Netdata entirely, replaced with Beszel.

```bash
# Uninstall Netdata
wget -O /tmp/netdata-kickstart.sh https://get.netdata.cloud/kickstart.sh
sh /tmp/netdata-kickstart.sh --uninstall
```

**Beszel Difference**:
- Agent uses <1% CPU, ~10MB RAM
- Only processes data when dashboard is **actively viewed**
- Perfect for on-demand monitoring

**Time Lost**: 1 day running with Netdata before noticing thermal issues

**Lesson Learned**: On resource-constrained hardware, monitoring tools can be more expensive than the services they monitor. Choose "on-demand" over "always-on" telemetry.

---

### 7. External Library Path Confusion

**The Problem**: PhotoPrism/Immich wouldn't see external HDD photos despite correct Docker volume mounts.

**What I Did Wrong**:
```yaml
volumes:
  - /media/2tb_external/mypics:/mnt/photos:ro  # ❌ Wrong path in UI
```

Then in UI, entered: `/media/2tb_external/mypics` (the **host** path)

**Why It Failed**: The UI needs the **container** path, not the host path.

**Correct Setup**:
```yaml
# docker-compose.yml
volumes:
  - /media/2tb_external/mypics:/usr/src/app/external/mypics:ro
```

**In UI**: `/usr/src/app/external/mypics` (container path)

![Path Mapping](./images/docker-path-mapping.jpg)
*Photo placeholder: Diagram showing host path → container path mapping*

**Time Lost**: 45 minutes of "why isn't it scanning?!"

**Lesson Learned**: Docker containers see their own filesystem. Always use the **container-side path** in application configs.

---

### 8. Immich Database Storage Errors

**The Problem**: Immich crashed with cryptic database errors about missing folders.

**Error**:
```
Failed to read: "/data/encoded-video/.immich" - ENOENT: no such file
```

**Root Cause**: Immich's "system integrity check" expects hidden `.immich` marker files in specific subdirectories. When I changed `UPLOAD_LOCATION`, these weren't created.

**The Fix**:
```bash
cd /media/2tb_external/mypics/new_uploads
mkdir -p encoded-video thumbs library upload profile backups
touch encoded-video/.immich thumbs/.immich library/.immich \
      upload/.immich profile/.immich backups/.immich
```

**Why This Exists**: Safety feature. If your external drive unmounts, Immich sees missing `.immich` files and refuses to start (preventing writes to the small SSD by mistake).

**Time Lost**: 30 minutes debugging, 5 minutes fixing

**Lesson Learned**: Read Immich docs on storage migration. The `.immich` marker system is clever but undocumented in error messages.

---

## Design Decisions I'd Change

### 1. Should Have Used PhotoPrism From Day 1

**Regret**: The Immich detour cost a full day of work.

**Why PhotoPrism Immediately**:
- Project started with legacy organized folders
- Multi-user wasn't actually needed (family shares one login)
- Mobile sync could use Syncthing instead

**Counterargument**: The Immich experience taught valuable lessons about metadata handling and Docker volume management. Not wasted time, but inefficient.

---

### 2. Homepage Dashboard First, Services Second

**Regret**: Deployed services randomly, then tried to organize them in Homepage.

**Better Approach**:
1. Set up Homepage first
2. Add services one-by-one
3. Test each in dashboard before adding next

**Benefit**: Would have caught WebSocket issues, path problems, and accessibility issues immediately.

---

### 3. Snapshot Before Major Changes

**Regret**: No LVM snapshots before:
- Immich → PhotoPrism migration
- Docker purge/reinstall
- Disk expansion

**Better Approach**:
```bash
# Create snapshot before risky changes
sudo lvcreate -L 5G -s -n before_migration /dev/ubuntu-vg/ubuntu-lv

# If disaster strikes:
sudo lvconvert --merge /dev/ubuntu-vg/before_migration
```

**Benefit**: One-command rollback for any mistake.

---

## Small Annoyances

### 1. Tailscale Hostname Resolution

**Issue**: `http://<yourpcname>:2283` doesn't resolve from some devices.

**Workaround**: Use Tailscale IP directly (e.g., `http://100.x.x.x:2283`) or add to `/etc/hosts` on client devices.

**Better Solution**: Use Tailscale's MagicDNS feature or set up Pi-hole/AdGuard for local DNS.

---

### 2. Homepage Background Image

**Issue**: Took 20 minutes to figure out where to place custom background image.

**Answer**: `/app/config/public/` inside container, or use `custom.css` with data URI.

---

### 3. Docker Compose Version Confusion

**Issue**: Some tutorials use `version: "3.8"`, some use `version: "3"`, some omit it entirely.

**Answer**: Version field is deprecated in Docker Compose v2. Modern practice is to omit it.

---

### 4. WeTTY /wetty Suffix

**Issue**: Assumed `http://<yourpcname>:2678` would work. Got 404.

**Reality**: WeTTY serves on `/wetty` path: `http://<yourpcname>:2678/wetty`

---

## What I'd Do Differently Next Time

1. **Research folder vs timeline philosophy** before choosing photo management
2. **Use apt Docker from the start** (never snap)
3. **LVM snapshots before major changes** (safety net)
4. **Deploy Homepage first** (organization before chaos)
5. **Thermal monitoring from day 1** (Beszel, not Netdata)
6. **ExifTool metadata fixes before import** (not after)
7. **Document as you go** (not reconstruct from memory)
8. **Test external drive unmount scenario** (what breaks?)
9. **Set up backups immediately** (not "later")
10. **Consider desktop over laptop** (better thermals, expansion)

## The "Let It Rip" Philosophy

Initially worried about overworking a 10-year-old laptop. Eventually adopted a "let it rip" mentality:

**Pros**:
- Learned thermal limits firsthand
- Stopped over-optimizing premature
- Hardware proved more resilient than expected

**Cons**:
- Probably shortened laptop lifespan
- Could have prevented some thermal throttling
- Thermal repaste now mandatory, not optional

**Verdict**: Old hardware should be pushed. Learning > hardware preservation. But maybe use a vertical stand from day 1. The W451 with 28GB RAM proved more than capable - the bottleneck was thermal management, not raw specs.

![Thermal Throttling](./images/thermal-throttling-graph.jpg)
*Photo placeholder: Temperature graph showing CPU throttling events*

---

## Biggest Time Sinks

| Issue | Time Lost | Preventable? |
|-------|-----------|--------------|
| Snap Docker debugging | 2 hours | ✅ Yes (read forums first) |
| Immich → PhotoPrism migration | 8 hours | ✅ Yes (research philosophy) |
| Google Photos metadata fixing | 6 hours | ⚠️ Partially (use immich-go) |
| Netdata thermal issues | 1 day | ✅ Yes (Beszel from start) |
| LVM disk space confusion | 30 min | ✅ Yes (check `vgs` post-install) |
| Cockpit config duplication | 1 hour | ❌ No (random corruption) |
| Docker path mapping | 45 min | ✅ Yes (RTFM) |

**Total Preventable Time Lost**: ~18 hours across 1 week

**Lessons That Required Pain**: Metadata handling, thermal limits, organizational philosophy

---

## The Python Metadata Script

Initially wrote a custom Python script to fix photo dates. Later learned ExifTool could do it in one line.

**The Script** (saved for posterity):
```python
#!/usr/bin/env python3
import os
import re
from datetime import datetime
from PIL import Image
import piexif

pattern = re.compile(r'(\d{8}|\d{14})')

for root, dirs, files in os.walk('/media/2tb_external/mypics'):
    for filename in files:
        match = pattern.search(filename)
        if match:
            date_str = match.group(1)
            # ... date parsing and EXIF writing logic ...
```

**Time Spent**: 2 hours writing, 1 hour debugging

**ExifTool Equivalent**: 1 minute
```bash
exiftool -if 'not $DateTimeOriginal' \
  '-DateTimeOriginal<${filename;m/(\d{14})/;$_=$1}' \
  -overwrite_original .
```

**Lesson**: Sometimes the right tool is more valuable than coding skills.

---

## Conclusion

Every mistake was a learning opportunity:
- **Snap Docker** → Understanding daemon architectures
- **Immich detour** → Recognizing software philosophy fit
- **LVM confusion** → Linux storage management
- **Metadata hell** → EXIF standards and Google's data export practices
- **Netdata heat** → Resource-constrained system design
- **Path mapping** → Docker volume semantics

The homelab works beautifully now, but it's built on a foundation of errors. **This documentation is more valuable than the final config files** because it shows the journey, not just the destination.

And the biggest win? **Tailscale making it all accessible from the office, on my phone, without any networking headaches.** That's the charm that makes the whole setup worthwhile.

Would I do it again knowing the pitfalls? Absolutely. But I'd do it faster. 🚀
