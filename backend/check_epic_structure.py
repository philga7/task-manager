#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.services.GitHubService import GitHubService

async def check_epic_structure():
    service = GitHubService()
    epic = await service.create_epic_issue('Test Epic Structure', 'Testing epic data structure', ['test'])
    print("Epic keys:", list(epic.keys()))
    print("Epic:", epic)

if __name__ == "__main__":
    asyncio.run(check_epic_structure())
