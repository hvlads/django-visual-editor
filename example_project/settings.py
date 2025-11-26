import os
import sys
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file if it exists
env_file = BASE_DIR / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                value = value.strip()
                # Remove quotes if present
                if value and value[0] in ('"', "'") and value[-1] == value[0]:
                    value = value[1:-1]
                os.environ.setdefault(key.strip(), value)

# Add parent directory to Python path to access django_visual_editor
sys.path.insert(0, str(BASE_DIR.parent))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-example-key-change-in-production"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_visual_editor",
    "blog",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Authentication
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# AI Assistant Configuration
# To enable AI features:
# 1. Install: pip install openai
# 2. Set environment variables in .env file:
#    - AI_API_KEY=your-api-key
#    - AI_BASE_URL=https://api.openai.com/v1  (or your OpenAI-compatible endpoint)
# 3. Configure the models you want to use below

VISUAL_EDITOR_AI_CONFIG = {
    "enabled": True,
    "default_model": "yandex-gpt",  # ID from models list below
    # Available models with their configurations
    "models": [
        {
            "id": "yandex-gpt",
            "name": "YandexGPT",
            "provider": "Yandex",
            "model": f"gpt://{os.environ.get('YANDEX_FOLDER_ID')}/yandexgpt/latest",
            "api_key": os.environ.get("YANDEX_API_KEY"),
            "base_url": "https://llm.api.cloud.yandex.net/v1",
            "project": os.environ.get("YANDEX_FOLDER_ID"),
        },
        {
            "id": "yandex-gpt-lite",
            "name": "YandexGPT Lite",
            "provider": "Yandex",
            "model": f"gpt://{os.environ.get('YANDEX_FOLDER_ID')}/yandexgpt-lite/latest",
            "api_key": os.environ.get("YANDEX_API_KEY"),
            "base_url": "https://llm.api.cloud.yandex.net/v1",
            "project": os.environ.get("YANDEX_FOLDER_ID"),
        },
        {
            "id": "gpt-4o",
            "name": "GPT-4o",
            "provider": "OpenAI",
            "model": "gpt-4o",
            "api_key": os.environ.get("OPENAI_API_KEY"),
            "base_url": None,  # Uses OpenAI default
            "project": None,
        },
        {
            "id": "gpt-3.5-turbo",
            "name": "GPT-3.5 Turbo",
            "provider": "OpenAI",
            "model": "gpt-3.5-turbo",
            "api_key": os.environ.get("OPENAI_API_KEY"),
            "base_url": None,
            "project": None,
        },
    ],
    # Optional: Override default system prompts (English recommended for best results)
    # 'system_prompts': {
    #     'generate': """Your custom generation prompt...""",
    #     'edit': """Your custom editing prompt...""",
    # },
}
