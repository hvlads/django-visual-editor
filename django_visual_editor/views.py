from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import EditorImage
import json


@require_http_methods(["POST"])
@login_required
def upload_image(request):
    """
    Handle image upload from the editor
    """
    try:
        if "image" not in request.FILES:
            return JsonResponse({"error": "No image provided"}, status=400)

        image_file = request.FILES["image"]

        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image_file.content_type not in allowed_types:
            return JsonResponse({"error": "Invalid file type"}, status=400)

        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if image_file.size > max_size:
            return JsonResponse(
                {"error": "File too large. Max size is 5MB"}, status=400
            )

        # Create image instance
        editor_image = EditorImage(
            image=image_file,
            uploaded_by=request.user if request.user.is_authenticated else None,
        )
        editor_image.save()

        return JsonResponse(
            {"success": True, "url": editor_image.image.url, "id": editor_image.id}
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
