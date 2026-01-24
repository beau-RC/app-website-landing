#!/bin/bash
# Simple script to start a local web server
cd "$(dirname "$0")"
python3 -m http.server 8080
