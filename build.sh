#!/bin/bash

# Build the mdBook
mdbook build

# Copy static assets to the built book directory
cp static/screenshots/*.png book/ 2>/dev/null || true

echo "Book built successfully with static assets!"