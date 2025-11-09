from django.test import TestCase
from django_visual_editor import VisualEditorField, VisualEditorWidget


class VisualEditorFieldTest(TestCase):
    def test_field_initialization(self):
        """Test VisualEditorField initialization"""
        field = VisualEditorField(
            config={"min_height": 400, "placeholder": "Test placeholder"}
        )

        self.assertEqual(field.editor_config["min_height"], 400)
        self.assertEqual(field.editor_config["placeholder"], "Test placeholder")

    def test_field_formfield_uses_widget(self):
        """Test that formfield uses VisualEditorWidget"""
        field = VisualEditorField()
        form_field = field.formfield()

        self.assertIsInstance(form_field.widget, VisualEditorWidget)

    def test_field_formfield_passes_config(self):
        """Test that formfield passes config to widget"""
        field = VisualEditorField(config={"min_height": 500})
        form_field = field.formfield()

        self.assertEqual(form_field.widget.config["min_height"], 500)

    def test_field_deconstruct(self):
        """Test field deconstruction for migrations"""
        field = VisualEditorField(config={"min_height": 400})
        name, path, args, kwargs = field.deconstruct()

        self.assertIn("config", kwargs)
        self.assertEqual(kwargs["config"]["min_height"], 400)

    def test_field_deconstruct_no_config(self):
        """Test field deconstruction without config"""
        field = VisualEditorField()
        name, path, args, kwargs = field.deconstruct()

        # Empty config should not be in kwargs
        self.assertNotIn("config", kwargs)
