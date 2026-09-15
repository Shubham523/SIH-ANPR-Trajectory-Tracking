from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.models.database import get_blacklist, add_to_blacklist, remove_from_blacklist

router = APIRouter(tags=["blacklist"])

class BlacklistCreate(BaseModel):
    plate_text: str
    reason: str
    threat_level: Optional[str] = "HIGH"

@router.get("/blacklist", summary="Get all blacklisted vehicle plates")
def fetch_blacklist():
    return get_blacklist()

@router.post("/blacklist", summary="Add plate to hotlist / blacklist")
def create_blacklist_entry(item: BlacklistCreate):
    if not item.plate_text or not item.reason:
        raise HTTPException(status_code=400, detail="Plate text and reason are required")
    success = add_to_blacklist(item.plate_text, item.reason, item.threat_level)
    return {"status": "SUCCESS", "plate": item.plate_text.upper(), "reason": item.reason}

@router.delete("/blacklist/{plate_text}", summary="Remove plate from blacklist")
def delete_blacklist_entry(plate_text: str):
    success = remove_from_blacklist(plate_text)
    return {"status": "SUCCESS", "plate": plate_text.upper()}
