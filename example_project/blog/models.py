from django.db import models
from django.contrib.auth.models import User
from django_visual_editor import VisualEditorField


class BlogPost(models.Model):
    """Example blog post model using the visual editor"""

    title = models.CharField(max_length=200)
    content = VisualEditorField(
        config={
            "min_height": 400,
            "max_height": 800,
            "placeholder": "Write your blog post here...",
        }
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
