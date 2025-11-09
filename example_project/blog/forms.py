from django import forms
from .models import BlogPost


class BlogPostForm(forms.ModelForm):
    """Form for creating/editing blog posts with visual editor"""

    class Meta:
        model = BlogPost
        fields = ["title", "content", "published"]
        # No need to specify widget - VisualEditorField handles it automatically!
