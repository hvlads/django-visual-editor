from django.test import TestCase
from django_visual_editor import VisualEditorWidget


class VisualEditorWidgetTest(TestCase):
    def test_widget_initialization(self):
        """Test widget initialization"""
        widget = VisualEditorWidget()

        self.assertIsNotNone(widget)
        self.assertEqual(widget.config, {})

    def test_widget_with_config(self):
        """Test widget with custom config"""
        config = {"min_height": 400, "max_height": 800, "placeholder": "Type here..."}

        widget = VisualEditorWidget(config=config)

        self.assertEqual(widget.config, config)

    def test_widget_media(self):
        """Test that widget includes necessary media files"""
        widget = VisualEditorWidget()

        media = widget.media

        # Check CSS
        self.assertIn("django_visual_editor/css/editor.css", str(media))

        # Check JS
        self.assertIn("django_visual_editor/js/editor.bundle.js", str(media))

    def test_widget_get_context(self):
        """Test widget context generation"""
        widget = VisualEditorWidget(
            config={"min_height": 300, "placeholder": "Start typing..."}
        )

        context = widget.get_context("content", "", {"id": "id_content"})

        self.assertIn("widget", context)
        self.assertIn("editor_config", context["widget"])

    def test_widget_attrs(self):
        """Test widget custom attributes"""
        widget = VisualEditorWidget(attrs={"data-test": "value"})

        self.assertIn("data-test", widget.attrs)
        self.assertEqual(widget.attrs["data-test"], "value")
