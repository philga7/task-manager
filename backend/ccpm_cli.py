#!/usr/bin/env python3
"""
CCPM CLI - Command Line Interface for Claude Code PM
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.cli.cli import main

if __name__ == "__main__":
    asyncio.run(main())
