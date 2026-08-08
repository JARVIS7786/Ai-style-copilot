from pydantic import BaseModel


class ClothingItem(BaseModel):
    category: str
    color: str
    pattern: str
    fit: str


class StyleAnalysis(BaseModel):
    clothing: list[ClothingItem]
    style: list[str]
    occasions: list[str]
    dominant_colors: list[str]

class StyleProfile(BaseModel):
    styles: list [str]
    preffered_colors:list[str]
    preferred_fits:list[str]
    common_patterns:list[str]
    ocassions:list[str]
    