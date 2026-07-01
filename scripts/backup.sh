#!/bin/bash
# OpticsKit 完整备份 - 每天凌晨 3 点执行

BACKUP_DIR=/home/admin/backups
PROJECT_DIR=/home/admin/opticskit
DATE=$(date +%Y%m%d)
LOG="$BACKUP_DIR/backup.log"

log() { echo "[$(date)] $1" | tee -a "$LOG"; }

log '=== Backup started ==='

# L1: Code
SRC_BACKUP="$BACKUP_DIR/code-$DATE.tar.gz"
cd "$PROJECT_DIR"
if tar -czf "$SRC_BACKUP" public/tools/*.html src/ 2>/dev/null; then
  log "L1 code: $(du -h $SRC_BACKUP | cut -f1)"
else
  log 'L1 WARNING: code backup empty or failed'
fi

# L2: Config
CFG_BACKUP="$BACKUP_DIR/config-$DATE.tar.gz"
if sudo tar -czf "$CFG_BACKUP" /etc/nginx/sites-enabled/opticskit /etc/systemd/system/opticskit.service 2>/dev/null; then
  sudo chown admin:admin "$CFG_BACKUP"
  log "L2 config: $(du -h $CFG_BACKUP | cut -f1)"
else
  log 'L2 WARNING: config backup failed'
fi

# L3: Data
DATA_BACKUP="$BACKUP_DIR/data-$DATE.tar.gz"
if [ -d "$PROJECT_DIR/data" ] && tar -czf "$DATA_BACKUP" -C "$PROJECT_DIR" data/ 2>/dev/null; then
  log "L3 data: $(du -h $DATA_BACKUP | cut -f1)"
else
  log 'L3 WARNING: data dir empty or missing'
fi

# L4: Weekly full snapshot (Sunday only)
if [ $(date +%u) -eq 7 ]; then
  FULL_BACKUP="$BACKUP_DIR/full-$DATE.tar.gz"
  cd "$PROJECT_DIR"
  if tar -czf "$FULL_BACKUP" . --exclude=node_modules --exclude=.next --exclude=.git 2>/dev/null; then
    log "L4 full: $(du -h $FULL_BACKUP | cut -f1)"
  else
    log 'L4 WARNING: full backup failed'
  fi
fi

# Cleanup
find "$BACKUP_DIR" -name 'code-*.tar.gz' -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR" -name 'config-*.tar.gz' -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR" -name 'data-*.tar.gz' -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR" -name 'full-*.tar.gz' -mtime +14 -delete 2>/dev/null
find "$BACKUP_DIR" -name 'community-*.tar.gz' -mtime +30 -delete 2>/dev/null

log '=== Backup completed ==='
