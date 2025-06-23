#!/bin/bash
set -e
cd frontend
pnpm exec playwright install --with-deps
