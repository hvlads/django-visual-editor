from django.contrib import admin
from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "published", "created_at")
    list_filter = ("published", "created_at")
    search_fields = ("title", "content")
    readonly_fields = ("created_at", "updated_at")
    # No custom form needed - VisualEditorField handles the widget automatically!
