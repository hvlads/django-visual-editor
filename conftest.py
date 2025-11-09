"""
Pytest configuration for Django Visual Editor
"""

import os
import sys
import django
from pathlib import Path

# Add project root and tests directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "django_visual_editor" / "tests"))

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "test_settings")

# Setup Django
django.setup()


def pytest_configure(config):
    """Configure pytest with Django settings"""
    from django.conf import settings

    settings.DEBUG = False

    # Use in-memory database for tests
    settings.DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
