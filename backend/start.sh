#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Activate virtual environment and start the server
source venv/bin/activate
python3 main.py
