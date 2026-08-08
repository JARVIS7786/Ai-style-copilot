import os
import json
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.vision_service import VisionService

router = APIRouter(
    prefix="/api/v1/style",
    tags=["Style Analysis"]
)

vision_service = VisionService()
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/analyze")
async def analyze_style(image: UploadFile = File(...)):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG AND webp images are supported")
    
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Upload image is Empty")
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image size must be less than 10 MB")
    
    try:
        # 1. Gemini se analyze karwao
        result = await vision_service.analyze_image(
            image_bytes=image_bytes,
            mime_type=image.content_type
        )
        
        # 2. 100% Safe Folder Creation (Absolute Path)
        # Ye Render ko exact location batayega ki folder kahan banana hai
        save_dir = os.path.join(os.getcwd(), "test_data_storage")
        os.makedirs(save_dir, exist_ok=True)
        
        unique_id = str(uuid.uuid4())[:6]
        safe_filename = f"{unique_id}_{image.filename}"
        
        # Photo save kar rahe hain
        file_path = os.path.join(save_dir, safe_filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
            
        # Result JSON mein save kar rahe hain
        json_path = os.path.join(save_dir, "accuracy_results.json")
        with open(json_path, "a") as f:
            log_data = {
                "id": unique_id,
                "filename": safe_filename,
                "ai_result": result.model_dump()
            }
            f.write(json.dumps(log_data) + "\n")
            
        return result
        
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Vision analysis failed: {str(exc)}")