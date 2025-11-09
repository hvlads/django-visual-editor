"""
URLs for testing
"""

from django.urls import path, include

urlpatterns = [
    path("editor/", include("django_visual_editor.urls")),
]
