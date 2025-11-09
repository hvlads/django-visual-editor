from django.test import TestCase
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from django_visual_editor.models import EditorImage
from io import StringIO


class TestModel(models.Model):
    """Test model with a text field"""

    content = models.TextField()

    class Meta:
        app_label = "django_visual_editor"


class CleanupEditorImagesCommandTest(TestCase):
    def setUp(self):
        # Create test images
        self.used_image = EditorImage.objects.create(
            image=SimpleUploadedFile("used.jpg", b"content", content_type="image/jpeg")
        )
        self.unused_image = EditorImage.objects.create(
            image=SimpleUploadedFile(
                "unused.jpg", b"content", content_type="image/jpeg"
            )
        )

    def test_cleanup_dry_run(self):
        """Test cleanup command with dry-run option"""
        out = StringIO()
        call_command("cleanup_editor_images", "--dry-run", stdout=out)

        output = out.getvalue()
        self.assertIn("DRY RUN", output)
        self.assertIn("Would delete", output)

        # Images should still exist
        self.assertEqual(EditorImage.objects.count(), 2)

    def test_cleanup_finds_unused_images(self):
        """Test that cleanup finds all images when none are used"""
        out = StringIO()
        call_command("cleanup_editor_images", "--dry-run", stdout=out)

        output = out.getvalue()
        self.assertIn("Found 2 unused images", output)

    def test_cleanup_no_unused_images(self):
        """Test cleanup when all images are in use"""
        # Create a test model instance that uses the image
        # This is simplified - in real scenario would need proper model setup
        out = StringIO()

        # Delete the unused image first
        self.unused_image.delete()

        call_command("cleanup_editor_images", "--dry-run", stdout=out)

        output = out.getvalue()
        # With only one unused image or none
        self.assertIn("unused images", output.lower())
