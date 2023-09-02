#!/usr/bin/env bash

# Move the files that don't need a build step into the addon directory

set -eu

SRC_DIR=./src/
BUILD_DIR=./addon/
JS_VENDOR_FILE="${BUILD_DIR}/js/vendor.js"
VENDORED_JS="webextension-polyfill/dist/browser-polyfill.min.js"
ASSETS="css icons images html js manifest.json"

mkdir -p "${BUILD_DIR}"

echo 'copying asset directories'
for asset in $ASSETS; do
    echo "  $asset"
    cp -r "${SRC_DIR}/${asset}" "${BUILD_DIR}"
done

mkdir -p "${BUILD_DIR}/js"
:> "${JS_VENDOR_FILE}"

echo 'bundling vendored js files...'
for vendor in $VENDORED_JS; do
    echo "  ${vendor}"
    cat "node_modules/${vendor}" >> "${JS_VENDOR_FILE}"
done

echo 'done'
