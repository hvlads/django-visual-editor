from django.urls import path
from . import views

app_name = "django_visual_editor"

urlpatterns = [
    path("upload/", views.upload_image, name="upload_image"),
]
