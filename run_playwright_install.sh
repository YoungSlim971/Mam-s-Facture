#!/bin/bash
set -e
# cd frontend # Removed as we expect to be in the frontend directory already
pnpm exec playwright install --with-deps
