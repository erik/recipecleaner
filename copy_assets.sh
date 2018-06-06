#!/usr/bin/env bash

# Move the files that don't need a build step into the addon directory

set -eu

SRC_DIR=./src/
BUILD_DIR=./addon/

JS_VENDOR_FILE="$BUILD_DIR/js/vendor.js"
VENDORED_JS="webextension-polyfill/dist/browser-polyfill.min.js"

ASSET_DIRS="css icons images"
TOP_LEVEL_ASSETS="html/ manifest.json"

echo 'copying asset directories'
for d in $ASSET_DIRS; do
    echo "  $d"
    [[ -d "$BUILD_DIR/$d" ]] || mkdir -p "$BUILD_DIR/$d"
    cp -r "$SRC_DIR/$d/" "$BUILD_DIR/$d/"
done

echo 'copying top level assets'
for asset in $TOP_LEVEL_ASSETS; do
    echo "  $asset"
    cp -r "$SRC_DIR/$asset" "$BUILD_DIR"
done

[[ -d "$BUILD_DIR/js/" ]] || mkdir -p "$BUILD_DIR/js"
:> "$JS_VENDOR_FILE"

echo 'bundling vendored js files...'
for vendor in $VENDORED_JS; do
    echo "  $vendor"
    cat "node_modules/$vendor" >> "$JS_VENDOR_FILE"
done

echo 'done'
