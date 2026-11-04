#!/bin/bash
# Rebuilds the brand assets from the master logo.
#
#   master: assets/logo-master.png   (1536x1024, gold logo on black)
#
# Produces:
#   assets/logo.png             transparent background, for light surfaces
#   assets/logo-dark.png        original black background, for the sidebar/splash
#   assets/logo-mark.png        the emblem alone ($ and arrow), transparent
#   assets/logo-mark-96.png     small emblem used in printed documents
#   assets/favicon-32.png       browser tab
#   assets/favicon.ico          legacy tab/bookmark icon
#   assets/apple-touch-icon.png home-screen icon (180px, dark tile)
#
# The transparency step turns black into alpha using the pixel's brightest
# channel, so the gold keeps its shading and the glow fades out smoothly
# instead of leaving a rectangle of black.
set -e
cd "$(dirname "$0")"

MASTER=assets/logo-master.png
[ -f "$MASTER" ] || { echo "missing $MASTER"; exit 1; }

TRANSPARENT="-alpha set -channel A -fx max(max(r,g),b)*1.25 +channel"

# --- full lock-up ------------------------------------------------------------
convert "$MASTER" $TRANSPARENT -resize 620x -colors 160 -depth 8 -strip PNG8:assets/logo.png
convert "$MASTER" -resize 620x -colors 160 -depth 8 -strip PNG8:assets/logo-dark.png

# --- emblem ------------------------------------------------------------------
convert "$MASTER" -crop 560x390+500+50 +repage $TRANSPARENT \
  -trim +repage -resize 240x240 -background none -gravity center -extent 256x256 \
  -colors 160 -depth 8 -strip PNG8:assets/logo-mark.png
convert "$MASTER" -crop 560x390+500+50 +repage $TRANSPARENT \
  -trim +repage -resize 96x96 -background none -gravity center -extent 96x96 \
  -colors 128 -depth 8 -strip PNG8:assets/logo-mark-96.png

# --- icons -------------------------------------------------------------------
convert assets/logo-mark.png -resize 32x32 -background none -gravity center \
  -extent 32x32 -strip assets/favicon-32.png
convert assets/logo-mark.png -resize 64x64 -background none -gravity center \
  -extent 64x64 -strip assets/favicon-64.png
convert assets/favicon-64.png assets/favicon-32.png assets/favicon.ico

# rounded dark tile, so the gold still reads in a light browser toolbar
convert -size 180x180 xc:'#15171C' \
  \( assets/logo-mark.png -resize 132x132 \) -gravity center -composite \
  \( +clone -alpha extract -draw 'fill black polygon 0,0 0,34 34,0 fill white circle 34,34 34,0' \
     \( +clone -flip \) -compose Multiply -composite \
     \( +clone -flop \) -compose Multiply -composite \
  \) -alpha off -compose CopyOpacity -composite \
  -strip assets/apple-touch-icon.png

echo "brand assets built:"
ls -l assets/*.png assets/*.ico | awk '{printf "  %-34s %6.1f KB\n", $9, $5/1024}'
