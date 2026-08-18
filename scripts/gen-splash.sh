#!/bin/bash
# Generate iOS launch images and the <link> tags that select them.
#
# iOS ignores the manifest's background_color and shows a blank white screen on
# cold launch unless an apple-touch-startup-image matches the exact device
# metrics. Portrait only, dark only — the app's default theme and the value in
# background_color.
#
# Usage: scripts/gen-splash.sh   (writes public/splash/ and prints the <link> tags)
set -e

PUB="$(cd "$(dirname "$0")/../public" && pwd)"
OUT="$PUB/splash"
MARK="$PUB/mark.svg"
BG="#0B0B0D"

rm -rf "$OUT"
mkdir -p "$OUT"

# pt-width pt-height dpr   → covers every iPhone and iPad still receiving iOS updates
DEVICES="
320 568 2
375 667 2
414 736 3
375 812 3
414 896 2
414 896 3
390 844 3
428 926 3
393 852 3
430 932 3
402 874 3
440 956 3
768 1024 2
810 1080 2
820 1180 2
834 1112 2
834 1194 2
1024 1366 2
"

TAGS=""
while read -r w h dpr; do
  [ -z "$w" ] && continue
  pw=$((w * dpr))
  ph=$((h * dpr))
  glyph=$((pw / 4))
  file="splash-${pw}x${ph}.png"

  magick -background none "$MARK" -resize ${glyph}x${glyph} /tmp/splash-glyph.png
  magick -size ${pw}x${ph} xc:"$BG" /tmp/splash-glyph.png -gravity center -composite \
    -strip -define png:compression-level=9 "PNG8:$OUT/$file"

  TAGS="$TAGS
    <link
      rel=\"apple-touch-startup-image\"
      media=\"(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)\"
      href=\"/splash/${file}\"
    />"
done <<< "$DEVICES"

echo "$TAGS" > "$OUT/../../scripts/.splash-tags.html"
echo "── generated $(ls "$OUT" | wc -l | tr -d ' ') launch images, $(du -sh "$OUT" | cut -f1) total"
echo "── link tags written to scripts/.splash-tags.html"
