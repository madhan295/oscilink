#!/bin/bash
echo "Testing folder structure..."
folders=(
  "packages/frontend/src/components/canvas"
  "packages/frontend/src/store"
  "packages/frontend/src/types"
  "packages/backend/src/routes"
  "packages/backend/src/services"
)
for f in "${folders[@]}"; do
  if [ -d "$f" ]; then echo "✓ $f"; else echo "✗ MISSING: $f"; fi
done

echo "Testing backend health..."
response=$(curl -s http://localhost:3001/health)
if echo "$response" | grep -q "ok"; then
  echo "✓ Backend health check passed"
else
  echo "✗ Backend health check failed. Got: $response"
fi