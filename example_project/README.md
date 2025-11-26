# Django Visual Editor - Example Project

This is a test project demonstrating the django-visual-editor with AI assistant features.

## Quick Start

### 1. Install dependencies

```bash
# Install django-visual-editor with AI support
pip install django-visual-editor[ai]

# Or install from source (for development)
pip install -e ".[ai]"  # from parent directory

# Or install base package and openai separately
pip install django-visual-editor
pip install openai
```

### 2. Set up AI API keys (optional)

Copy the example env file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your provider credentials:

```bash
# Yandex Cloud AI
YANDEX_API_KEY=your-api-key
YANDEX_FOLDER_ID=your-folder-id

# OpenAI (optional)
OPENAI_API_KEY=sk-...
```

### 3. Run migrations

```bash
python manage.py migrate
```

### 4. Create superuser

```bash
python manage.py createsuperuser
```

### 5. Build frontend (if you made changes)

```bash
cd ../frontend
npm install
npm run build
cd ../example_project
```

### 6. Run the server

```bash
python manage.py runserver
```

### 7. Access the application

- Blog: http://localhost:8000/
- Admin: http://localhost:8000/admin/

## Testing AI Features

1. **Create a blog post** in the admin or via the UI
2. **Click on a block** in the editor to select it
3. **Click 🤖 button** to add blocks to AI context
4. **Open the AI panel** on the right side
5. **Select a model** from the dropdown:
   - **Default Model**: Uses the model configured in `default_model` setting
   - **Specific models**: Choose YandexGPT, GPT-4o, etc. from the list
6. **Choose mode:**
   - **Generate**: Create new content from scratch
   - **Edit**: Improve selected blocks (requires context)
7. **Enter your prompt** in Russian or English
8. **Add optional instructions** (e.g., "Use formal tone", "Keep it short")
9. **Click Generate/Apply**

### AI Panel Features

- **Default Model Option**: When "Default Model" is selected, the system uses the model specified in `settings.py`
- **Per-Model Configuration**: Each model has its own API credentials and endpoint configuration
- **Context-Aware**: Add blocks to context using the 🤖 button before editing
- **Multi-Provider Support**: Switch between different AI providers without changing environment variables

## Configuration

AI configuration is in `settings.py`. Each model includes its own API configuration:

```python
VISUAL_EDITOR_AI_CONFIG = {
    'enabled': True,
    'default_model': 'yandex-gpt',  # ID from models list below

    'models': [
        {
            'id': 'yandex-gpt',
            'name': 'YandexGPT',
            'provider': 'Yandex',
            'model': f"gpt://{os.environ.get('YANDEX_FOLDER_ID')}/yandexgpt/latest",
            'api_key': os.environ.get('YANDEX_API_KEY'),
            'base_url': 'https://llm.api.cloud.yandex.net/v1',
            'project': os.environ.get('YANDEX_FOLDER_ID'),
        },
        {
            'id': 'gpt-4o',
            'name': 'GPT-4o',
            'provider': 'OpenAI',
            'model': 'gpt-4o',
            'api_key': os.environ.get('OPENAI_API_KEY'),
            'base_url': None,  # Uses OpenAI default
            'project': None,
        },
    ],
}
```

### Configuration Fields

- **`id`**: Unique identifier used in the UI dropdown
- **`name`**: Display name shown to users
- **`provider`**: Provider name (for display)
- **`model`**: Actual model name/URI passed to the API
- **`api_key`**: API key from environment variable
- **`base_url`**: API endpoint (None uses default)
- **`project`**: Project/folder ID (for Yandex or OpenAI organizations)

## Disabling AI

To disable AI features, set `'enabled': False` in `VISUAL_EDITOR_AI_CONFIG` or remove the config entirely.

## Models

The blog app includes a simple `Post` model with:
- Title
- Content (using VisualEditorField)
- Author
- Created/Updated timestamps

## Features Demonstrated

- ✅ Block-based visual editor
- ✅ Image upload support
- ✅ Rich text formatting
- ✅ Inline styles
- ✅ HTML mode toggle
- ✅ AI content generation
- ✅ AI content editing
- ✅ Context-aware AI
- ✅ Multiple AI providers

## Troubleshooting

### AI not working?

1. Check if `openai` is installed: `pip list | grep openai`
2. Verify API keys are set in `.env` (e.g., `YANDEX_API_KEY`, `YANDEX_FOLDER_ID`)
3. Restart Django server after changing `.env`
4. Check Django logs for errors
5. Ensure `'enabled': True` in AI config
6. Verify the selected model has valid API credentials configured

### Frontend not updating?

```bash
cd ../frontend
npm run build
cd ../example_project
python manage.py collectstatic --noinput
```

### No blocks showing?

1. Clear browser cache
2. Check console for JavaScript errors
3. Verify static files are served correctly
