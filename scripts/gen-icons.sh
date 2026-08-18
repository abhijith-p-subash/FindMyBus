#!/bin/bash
# Regenerate the FindMyBus icon set from the vector mark.
#
# Rasters are composited from separately-rendered PNGs rather than converted from
# a transform-bearing SVG: ImageMagick's SVG support is partial (it silently drops
# strokes, and transforms are unreliable), so anything subtle is done in pixels.
set -e

PUB="$(cd "$(dirname "$0")/../public" && pwd)"
WORK="$(mktemp -d)"
mkdir -p "$WORK"
cd "$WORK"

AMBER="#FFB020"
INK="#0B0B0D"

PIN='M32 5c-11.6 0-21 9.1-21 20.4 0 14.7 17.8 32.6 19.9 34.7a1.6 1.6 0 0 0 2.2 0C35.2 58 53 40.1 53 25.4 53 14.1 43.6 5 32 5Z'
BODY='M23 17.5H41A3 3 0 0 1 44 20.5V31.5A3 3 0 0 1 41 34.5H23A3 3 0 0 1 20 31.5V20.5A3 3 0 0 1 23 17.5Z'
WIN='M25.5 21H38.5A2 2 0 0 1 40.5 23V26A2 2 0 0 1 38.5 28H25.5A2 2 0 0 1 23.5 26V23A2 2 0 0 1 25.5 21Z'
W1='M23.8 31.5a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0Z'
W2='M35.8 31.5a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0Z'

# ── Source SVGs, one per fill colour / detail level ───────────────────────────
svg () { # $1 = out file, $2 = fill, $3 = full|simple
  local paths="$PIN $BODY $WIN $W1 $W2"
  [ "$3" = simple ] && paths="$PIN"
  cat > "$1" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024">
<path fill="$2" fill-rule="evenodd" d="$paths"/>
</svg>
EOF
}

svg mark-amber.svg   "$AMBER" full
svg mark-ink.svg     "$INK"   full
svg mark-ink-simple.svg "$INK" simple

# ── Tile + glyph compositor ──────────────────────────────────────────────────
# The mark occupies y 5..60 of a 64 grid, so rendering it at 0.8N gives a glyph
# 0.69N tall — a comfortable inset on an NxN tile.
tile () { # $1 = size, $2 = radius(0 for full bleed), $3 = glyph svg, $4 = out
  local n=$1 r=$2 glyph=$3 out=$4
  local g=$(python3 -c "print(round($n*0.8))")

  if [ "$r" = 0 ]; then
    magick -size ${n}x${n} xc:"$AMBER" tile.png
  else
    magick -size ${n}x${n} xc:none -fill "$AMBER" \
      -draw "roundrectangle 0,0 $((n-1)),$((n-1)) $r,$r" tile.png
  fi

  magick -background none "$glyph" -resize ${g}x${g} glyph.png
  magick tile.png glyph.png -gravity center -composite "$out"
}

R () { python3 -c "print(round($1*19/64))"; }   # tile radius, 19/64 of the edge

# ── Manifest / browser icons ─────────────────────────────────────────────────
tile 512 "$(R 512)" mark-ink.svg "$PUB/icon-512.png"
tile 192 "$(R 192)" mark-ink.svg "$PUB/icon-192.png"

# Maskable: full bleed, and the glyph pulled in further so the platform's mask
# cannot clip it. Safe zone is the centre 80%.
magick -size 512x512 xc:"$AMBER" tile.png
magick -background none mark-ink.svg -resize 328x328 glyph.png
magick tile.png glyph.png -gravity center -composite "$PUB/icon-maskable-512.png"

# Apple touch icon: opaque, square — iOS applies its own corner radius.
tile 180 0 mark-ink.svg "$PUB/apple-touch-icon.png"
magick "$PUB/apple-touch-icon.png" -alpha off "$PUB/apple-touch-icon.png"

# ── Favicon: bare amber pin, different artwork per size inside one .ico ──────
# Tileless on purpose. A solid amber silhouette holds its shape at 16px far
# better than a dark glyph knocked out of an amber tile, and it works on both
# light and dark tab strips. 48 and 32 keep the bus; 16 drops to a plain pin
# because the interior turns to mud below ~28px.
sed 's/#0B0B0D/#FFB020/' mark-ink-simple.svg > mark-amber-simple.svg

bare () { # $1 = size, $2 = glyph svg, $3 = out
  magick -background none "$2" -resize $(($1-1))x$(($1-1)) bg.png
  magick -size $1x$1 xc:none bg.png -gravity center -composite "$3"
}

bare 48 mark-amber.svg        ico-48.png
bare 32 mark-amber.svg        ico-32.png
bare 16 mark-amber-simple.svg ico-16.png
# PNG-encoded frames (Vista+ ICO). The BMP frames ImageMagick writes by default
# get palettised to 8-bit, which destroys the anti-aliasing the 32px bus needs.
magick ico-16.png ico-32.png ico-48.png \
  -define icon:format=png -type TrueColorAlpha "$PUB/favicon.ico"

echo "── written ──"
ls -la "$PUB"/icon-192.png "$PUB"/icon-512.png "$PUB"/icon-maskable-512.png \
       "$PUB"/apple-touch-icon.png "$PUB"/favicon.ico
magick identify "$PUB/favicon.ico"
