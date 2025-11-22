# Django Visual Editor

A modern block-based visual editor for Django with inline styles support. No external CSS required - all styles are embedded directly in HTML.

## Features

### Block-Based Architecture
- **6 Block Types**: Paragraph, Heading (H1-H6), List (ordered/unordered), Code, Quote, Image
- **Contextual Toolbar**: Appears when a block is selected, showing relevant formatting options
- **Add/Remove Blocks**: Easy block management with visual controls
- **Block Menu**: Quick access to all block types

### Inline Styles (No CSS Required!)
- **Text Alignment**: Left, center, right, justify
- **Text Size**: 5 preset sizes (14px - 24px)
- **Text Color**: 5 preset colors (gray, blue, green, red, yellow)
- **Text Formatting**: Bold, italic, underline
- **Universal Compatibility**: Styles work everywhere without additional CSS files

### Image Support
- **Upload**: Drag-and-drop or file picker
- **Resize**: Drag the edge to resize images
- **Replace**: Double-click image to change it
- **Alignment**: Left, center, right alignment support
- **Metadata Storage**: Image URL and width stored in block data

### Developer-Friendly
- **TypeScript**: Full TypeScript implementation with type safety
- **Block API**: Easy to extend with custom block types
- **HTML Export**: Clean HTML with inline styles
- **HTML Import**: Parse existing HTML with styles extraction
- **Auto Cleanup**: Management command to remove unused images

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
│   ├── fields.py              # Custom model field
│   ├── views.py               # View for image upload
│   ├── urls.py                # URL configuration
│   ├── management/            # Management commands
│   ├── static/                # Static files (compiled)
│   └── templates/             # Templates
├── frontend/                  # TypeScript sources
│   ├── src/
│   │   ├── blocks/           # Block types (paragraph, heading, list, code, quote, image)
│   │   ├── editor/           # Block editor, contextual toolbar, block menu
│   │   ├── utils/            # Utils (upload, compression)
│   │   └── styles/           # CSS styles
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
└── example_project/           # Usage example
    └── blog/                 # Demo blog application
```

## Technologies

- **Backend**: Django 4.2+
- **Frontend**: TypeScript, Webpack
- **Architecture**: Block-based editor with inline styles
- **Styles**: No external CSS required (inline styles)

## License

MIT
