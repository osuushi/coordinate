#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"
go build .

# Loop forever to restart the server even if it panics
while true; do
  echo "Restarting server..."
  sudo ./coordinate 80
  sleep 1
done
