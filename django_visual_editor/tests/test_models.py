from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django_visual_editor.models import EditorImage

User = get_user_model()


class EditorImageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_create_editor_image(self):
        """Test creating an editor image"""
        image_file = SimpleUploadedFile(
            "test_image.jpg", b"file_content", content_type="image/jpeg"
        )

        editor_image = EditorImage.objects.create(
            image=image_file, uploaded_by=self.user
        )

        self.assertIsNotNone(editor_image.id)
        self.assertEqual(editor_image.uploaded_by, self.user)
        self.assertIn("editor_uploads", editor_image.image.name)

    def test_editor_image_without_user(self):
        """Test creating an editor image without a user"""
        image_file = SimpleUploadedFile(
            "test_image.jpg", b"file_content", content_type="image/jpeg"
        )

        editor_image = EditorImage.objects.create(image=image_file)

        self.assertIsNotNone(editor_image.id)
        self.assertIsNone(editor_image.uploaded_by)

    def test_editor_image_ordering(self):
        """Test that images are ordered by uploaded_at descending"""
        image1 = EditorImage.objects.create(
            image=SimpleUploadedFile("img1.jpg", b"content", content_type="image/jpeg")
        )
        image2 = EditorImage.objects.create(
            image=SimpleUploadedFile("img2.jpg", b"content", content_type="image/jpeg")
        )

        images = list(EditorImage.objects.all())
        self.assertEqual(images[0], image2)
        self.assertEqual(images[1], image1)

    def test_editor_image_str(self):
        """Test string representation of EditorImage"""
        image = EditorImage.objects.create(
            image=SimpleUploadedFile("img.jpg", b"content", content_type="image/jpeg")
        )

        str_repr = str(image)
        self.assertIn("Image", str_repr)
        self.assertIn(str(image.id), str_repr)
