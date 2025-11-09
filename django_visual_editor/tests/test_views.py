from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django_visual_editor.models import EditorImage
import json

User = get_user_model()


class UploadImageViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.upload_url = reverse("django_visual_editor:upload_image")

    def test_upload_image_requires_login(self):
        """Test that upload requires authentication"""
        response = self.client.post(self.upload_url)
        self.assertEqual(response.status_code, 302)  # Redirect to login

    def test_upload_image_success(self):
        """Test successful image upload"""
        self.client.login(username="testuser", password="testpass123")

        image_file = SimpleUploadedFile(
            "test_image.jpg",
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04"
            b"\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02"
            b"\x02\x44\x01\x00\x3b",
            content_type="image/jpeg",
        )

        response = self.client.post(self.upload_url, {"image": image_file})

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data["success"])
        self.assertIn("url", data)
        self.assertIn("id", data)

        # Check that image was created in database
        self.assertEqual(EditorImage.objects.count(), 1)

    def test_upload_image_no_file(self):
        """Test upload without providing an image"""
        self.client.login(username="testuser", password="testpass123")

        response = self.client.post(self.upload_url, {})

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn("error", data)

    def test_upload_image_invalid_type(self):
        """Test upload with invalid file type"""
        self.client.login(username="testuser", password="testpass123")

        text_file = SimpleUploadedFile(
            "test.txt", b"content", content_type="text/plain"
        )

        response = self.client.post(self.upload_url, {"image": text_file})

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn("error", data)

    def test_upload_image_get_method_not_allowed(self):
        """Test that GET method is not allowed"""
        self.client.login(username="testuser", password="testpass123")

        response = self.client.get(self.upload_url)

        self.assertEqual(response.status_code, 405)  # Method not allowed
