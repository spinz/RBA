#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" = "editor" ] || [ "$1" = "-e" ]; then
    echo "Launching Godot 4 Editor for Ribbit's Big Adventure..."
    godot -e --path "$DIR"
else
    echo "Playing Ribbit's Big Adventure..."
    godot --path "$DIR"
fi
