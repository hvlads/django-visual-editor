from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import models
from django.db.models import Q
from django_visual_editor.models import EditorImage
import re


class Command(BaseCommand):
    help = "Clean up unused editor images from the database and filesystem"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        self.stdout.write("Searching for models with text/HTML fields...")

        # Find all uploaded images
        all_images = EditorImage.objects.all()
        total_images = all_images.count()
        self.stdout.write(f"Found {total_images} uploaded images")

        # Find all models that might contain editor content
        used_image_ids = set()
        models_checked = 0

        for model in apps.get_models():
            # Look for TextField or CharField that might contain HTML
            text_fields = [
                field
                for field in model._meta.get_fields()
                if isinstance(field, (models.TextField, models.CharField))
            ]

            if not text_fields:
                continue

            models_checked += 1
            self.stdout.write(f"Checking {model.__name__}...")

            for field in text_fields:
                try:
                    # Get all instances
                    for instance in model.objects.all():
                        content = getattr(instance, field.name, "")
                        if not content:
                            continue

                        # Find all image IDs in the content
                        image_ids = re.findall(r'data-image-id="(\d+)"', str(content))
                        used_image_ids.update(int(img_id) for img_id in image_ids)

                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Error checking {model.__name__}.{field.name}: {e}"
                        )
                    )

        self.stdout.write(f"Checked {models_checked} models")
        self.stdout.write(f"Found {len(used_image_ids)} images in use")

        # Find unused images
        unused_images = all_images.exclude(id__in=used_image_ids)
        unused_count = unused_images.count()

        if unused_count == 0:
            self.stdout.write(self.style.SUCCESS("No unused images found!"))
            return

        self.stdout.write(f"Found {unused_count} unused images")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No images will be deleted"))
            for image in unused_images:
                self.stdout.write(
                    f"  Would delete: {image.image.name} (ID: {image.id})"
                )
        else:
            # Delete unused images
            for image in unused_images:
                self.stdout.write(f"Deleting: {image.image.name} (ID: {image.id})")
                # Delete file from storage
                image.image.delete(save=False)
                # Delete database record
                image.delete()

            self.stdout.write(
                self.style.SUCCESS(f"Successfully deleted {unused_count} unused images")
            )
