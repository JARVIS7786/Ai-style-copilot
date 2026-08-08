import os

from google import genai
from google.genai import types

from app.schemas.style import StyleAnalysis


class VisionService:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash"

    async def analyze_image(
        self,
        image_bytes: bytes,
        mime_type: str,
    ) -> StyleAnalysis:

        prompt = """
        Analyze the clothing and fashion style visible in this image.

        Identify:
        - Each visible clothing item
        - Its dominant color
        - Its pattern
        - Its apparent fit
        - Overall fashion styles
        - Suitable occasions
        - Dominant colors in the outfit

        Focus only on observable clothing and styling characteristics.
        Do not infer sensitive personal attributes.

        Return the result using the requested structured schema.
        """

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    ),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=StyleAnalysis,
                ),
            )

            return StyleAnalysis.model_validate_json(response.text)

        except Exception:
            raise