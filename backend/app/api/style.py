from fastapi import APIRouter, File, UploadFile,HTTPException

from app.services.vision_service import VisionService

router = APIRouter(
    prefix="/api/v1/style",
    tags=["Style Analysis"]
)

vision_service = VisionService()

ALLOWED_IMAGE_TYPES= {
    "image/jpeg",
    "image/png",
    "image/webp"
}

MAX_FILE_SIZE = 10*1024*1024 #10MB

@router.post("/analyze")
async def analyze_style(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code = 400,
            detail="Only JPEG, PNG AND webp images are supported",
        )
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Upload image is Empty",
        )
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image size must be less than 10 MB",
        )
    try:
        result = await vision_service.analyze_image(
                image_bytes= image_bytes,
                mime_type = image.content_type
            )
    
    
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Vision analysis failed. Please try again",
            
        )from exc