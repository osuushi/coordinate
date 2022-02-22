#!/bin/bash

cd "$(dirname "$0")"
go build .

# Loop forever to restart the server even if it panics
while true; do
  echo "Restarting server..."
  ./coordinate
  sleep 1
done
