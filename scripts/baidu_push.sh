#!/bin/bash
# 百度 SEO 自动推送：每天推 10 条 sitemap 中尚未推送的 URL
set -e

SITEMAP="https://opticskit.cn/sitemap.xml"
TOKEN="M4PcAZrNk6bt64we"
SITE="https://opticskit.cn"
API="http://data.zz.baidu.com/urls?site=${SITE}&token=${TOKEN}"
PUSHED_FILE="/home/admin/opticskit/scripts/.baidu_pushed_urls"
DAILY_LOG="/home/admin/opticskit/scripts/baidu_push.log"

touch "$PUSHED_FILE"

# 拉取 sitemap 所有 URL
curl -s "$SITEMAP" | grep -o "${SITE}[^<]*" > /tmp/all_urls.txt

# 过滤出未推送的 URL
grep -vxFf "$PUSHED_FILE" /tmp/all_urls.txt > /tmp/to_push.txt || true

TOTAL=$(wc -l < /tmp/to_push.txt | tr -d " ")
if [ "$TOTAL" -eq 0 ]; then
  echo "[$(date +%F)] 全部 URL 已推送完毕，无待推送" >> "$DAILY_LOG"
  exit 0
fi

# 取前 10 条
head -10 /tmp/to_push.txt > /tmp/push_batch.txt
BATCH_COUNT=$(wc -l < /tmp/push_batch.txt | tr -d " ")

# 推送
RESULT=$(curl -s -X POST "$API" -H "Content-Type: text/plain" --data-binary @/tmp/push_batch.txt)

# 检查结果中的 success 字段
echo "$RESULT" | grep -q "\"success\"" && SUCCESS=1 || SUCCESS=0

if [ "$SUCCESS" = "1" ]; then
  # 提取成功推送的数量
  SUCC_NUM=$(echo "$RESULT" | grep -o "\"success\":[0-9]*" | grep -o "[0-9]*")
  # 只把成功推的 URL（前成功数量条）记录进去
  head -"${SUCC_NUM:-0}" /tmp/push_batch.txt >> "$PUSHED_FILE"
  echo "[$(date +%F)] 推送成功 ${SUCC_NUM}/${BATCH_COUNT} 条 (总待推 ${TOTAL})" >> "$DAILY_LOG"
else
  # 推送失败(quota 或错误)，不记录，下次重试
  echo "[$(date +%F)] 推送失败: ${RESULT} (总待推 ${TOTAL}，明日重试)" >> "$DAILY_LOG"
fi
