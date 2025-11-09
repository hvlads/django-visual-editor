# Django Visual Editor

A visual text editor for Django with image upload support, text formatting, and HTML compression.

## Features

- **Visual Editing**: Intuitive WYSIWYG editor
- **Text Formatting**:
  - Bold, Italic, Underline, Strikethrough
  - Font family selection (Arial, Times New Roman, Georgia, Courier New, etc.)
  - Font size selection (10px - 24px)
  - Clear formatting
- **Headings**: H1, H2, H3
- **Lists**: Numbered and bulleted lists
- **Code**:
  - Inline code (`<code>` tag) with toggle support
  - Code blocks (pre+code) for multi-line code
- **Images**: Upload via drag-and-drop, paste, or file picker
  - Resize images by dragging or using preset sizes (S, M, L, XL)
  - Align images (left, center, right)
  - Delete images
- **Links**: Create hyperlinks
- **Undo/Redo**: Full history support (Ctrl+Z, Ctrl+Y)
- **HTML Source Mode**: Toggle between visual and HTML code editing
- **HTML Compression**: Automatic conversion to compact HTML with inline styles
- **Keyboard Shortcuts**: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+Z (Undo), Ctrl+Y (Redo)
- **Auto Cleanup**: Command to remove unused images

## Installation

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install django Pillow

# Install Node.js dependencies for frontend build
cd frontend
npm install
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

For development with automatic rebuild:

```bash
npm run dev
```

### 3. Configure Django

Add to `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'django_visual_editor',
    ...
]

# Media files settings
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Add URL to `urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    ...
    path('editor/', include('django_visual_editor.urls')),
    ...
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 4. Run Migrations

```bash
python manage.py migrate
```

## Usage

### Option 1: Using VisualEditorField (Recommended)

The simplest way - just use the field in your model:

```python
from django.db import models
from django_visual_editor import VisualEditorField

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = VisualEditorField(
        config={
            'min_height': 400,
            'max_height': 800,
            'placeholder': 'Start typing...',
        }
    )
```

Then use it in forms and admin - no additional configuration needed:

```python
# forms.py
from django import forms
from .models import BlogPost

class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        # Widget is automatically set from the field!

# admin.py
from django.contrib import admin
from .models import BlogPost

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    pass  # Widget is automatically set from the field!
```

### Option 2: Using VisualEditorWidget Manually

If you prefer to use a regular TextField and configure the widget in forms:

```python
# models.py
from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()  # Regular TextField

# forms.py
from django import forms
from django_visual_editor import VisualEditorWidget
from .models import BlogPost

class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        widgets = {
            'content': VisualEditorWidget(
                config={
                    'min_height': 400,
                    'max_height': 800,
                    'placeholder': 'Start typing...',
                }
            ),
        }

# admin.py
from django.contrib import admin
from django_visual_editor import VisualEditorWidget
from .models import BlogPost
from django import forms

class BlogPostAdminForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = '__all__'
        widgets = {
            'content': VisualEditorWidget(),
        }

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    form = BlogPostAdminForm
```

### In Templates

```django
<!-- Display content -->
<div class="blog-content">
    {{ post.content|safe }}
</div>

<!-- Form -->
<form method="post">
    {% csrf_token %}
    {{ form.as_p }}
    {{ form.media }}  <!-- Important! Loads CSS and JS -->
    <button type="submit">Save</button>
</form>
```

## Configuration

Available configuration parameters for `VisualEditorWidget`:

```python
VisualEditorWidget(
    config={
        'min_height': 300,        # Minimum editor height (px)
        'max_height': 600,        # Maximum editor height (px)
        'placeholder': 'Text...', # Placeholder text
    }
)
```

## Cleanup Unused Images

Run the management command to remove unused images:

```bash
# Show what will be deleted (dry run)
python manage.py cleanup_editor_images --dry-run

# Delete unused images
python manage.py cleanup_editor_images
```

It's recommended to set up this command in cron for periodic cleanup.

## Example Project

Run the example blog:

```bash
cd example_project
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then open:
- http://localhost:8000/ - Post list
- http://localhost:8000/post/new/ - Create new post
- http://localhost:8000/admin/ - Django Admin

## Project Structure

```
django-visual-editor/
├── django_visual_editor/       # Django application
│   ├── models.py              # Model for uploaded images
│   ├── widgets.py             # Django widget
│   ├── views.py               # View for image upload
│   ├── urls.py                # URL configuration
│   ├── management/            # Management commands
│   ├── static/                # Static files (compiled)
│   └── templates/             # Templates
├── frontend/                  # TypeScript sources
│   ├── src/
│   │   ├── editor/           # Main editor
│   │   ├── utils/            # Utils (upload, compression)
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # CSS styles
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
└── example_project/           # Usage example
    └── blog/                 # Demo blog application
```

## Technologies

- **Backend**: Django 5.2+
- **Frontend**: TypeScript, Webpack
- **Editor**: Custom implementation using ContentEditable API
- **Styles**: Vanilla CSS

## License

MIT
