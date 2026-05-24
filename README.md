# Django Visual Editor

[![PyPI version](https://img.shields.io/pypi/v/django-visual-editor.svg?color=blue)](https://pypi.org/project/django-visual-editor/)
[![PyPI downloads](https://img.shields.io/pypi/dm/django-visual-editor.svg?color=green)](https://pypi.org/project/django-visual-editor/)
[![Python versions](https://img.shields.io/pypi/pyversions/django-visual-editor.svg)](https://pypi.org/project/django-visual-editor/)
[![Django versions](https://img.shields.io/badge/django-4.2%20%7C%205.x-092E20.svg?logo=django&logoColor=white)](https://pypi.org/project/django-visual-editor/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A rich text editor for Django with a clean document-style interface, AI assistant, and mobile support.

## Features

- **Rich text editing** — single contenteditable document with persistent toolbar
- **Formatting** — bold, italic, underline, strikethrough, headings, bullet/numbered lists, blockquote, code block, inline code, links
- **HTML source mode** — switch between visual and raw HTML editing
- **Fullscreen mode** — distraction-free writing
- **AI assistant** — right-side panel with selection editing, "Replace" / "Insert after" actions, and undo snapshots
- **Mic dictation** — Web Speech API in the AI panel (requires HTTPS)
- **Mobile-friendly** — responsive toolbar with large touch targets
- **Multi-provider AI** — OpenAI, Groq, OpenRouter, Yandex GPT, or any OpenAI-compatible API

## Installation

```bash
pip install django-visual-editor

# With AI support
pip install django-visual-editor[ai]
```

## Setup

Add to `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'django_visual_editor',
]

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Add to `urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    ...
    path('editor/', include('django_visual_editor.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Run migrations:

```bash
python manage.py migrate
```

## Usage

### Model field (recommended)

```python
from django_visual_editor import VisualEditorField

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = VisualEditorField()
```

### Widget

```python
from django_visual_editor import VisualEditorWidget

class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        widgets = {
            'content': VisualEditorWidget(config={'placeholder': 'Start writing...'}),
        }
```

### Template

```django
<div>{{ post.content|safe }}</div>

<form method="post">
    {% csrf_token %}
    {{ form.as_p }}
    {{ form.media }}
    <button type="submit">Save</button>
</form>
```

## AI Assistant (optional)

```python
VISUAL_EDITOR_AI_CONFIG = {
    'enabled': True,
    'default_model': 'gpt-4o',
    'models': [
        {
            'id': 'gpt-4o',
            'name': 'GPT-4o',
            'provider': 'OpenAI',
            'model': 'gpt-4o',
            'api_key': os.environ.get('OPENAI_API_KEY'),
            'base_url': None,
        },
        {
            'id': 'llama',
            'name': 'Llama 4 Scout',
            'provider': 'OpenRouter',
            'model': 'meta-llama/llama-4-scout:free',
            'api_key': os.environ.get('OPENROUTER_API_KEY'),
            'base_url': 'https://openrouter.ai/api/v1',
        },
    ],
}
```

Select text in the editor and click **✦ Ask AI** to edit the selection. The AI panel shows a preview before applying changes. Use the ↩ button to undo AI edits (up to 10 snapshots).

## Development

```bash
git clone https://github.com/hvlads/django-visual-editor.git
cd django-visual-editor

pip install -e ".[ai]"

cd frontend
npm install
npm run build
# or: npm run dev  (watch mode)
```

## Cleanup images

```bash
python manage.py cleanup_editor_images --dry-run
python manage.py cleanup_editor_images
```

## License

MIT
