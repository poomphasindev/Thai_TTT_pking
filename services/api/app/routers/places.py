from __future__ import annotations

import math
from typing import Any

import httpx
from fastapi import APIRouter, Query

from app.models import PlaceOut


router = APIRouter()

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

CATEGORY_FILTERS = {
    "food": [
        'node(around:{radius},{lat},{lng})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];',
        'way(around:{radius},{lat},{lng})["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"];',
    ],
    "shopping": [
        'node(around:{radius},{lat},{lng})["shop"];',
        'way(around:{radius},{lat},{lng})["shop"];',
        'node(around:{radius},{lat},{lng})["amenity"="marketplace"];',
        'way(around:{radius},{lat},{lng})["amenity"="marketplace"];',
    ],
    "attractions": [
        'node(around:{radius},{lat},{lng})["tourism"~"attraction|museum|gallery|viewpoint|artwork"];',
        'way(around:{radius},{lat},{lng})["tourism"~"attraction|museum|gallery|viewpoint|artwork"];',
        'node(around:{radius},{lat},{lng})["historic"];',
        'way(around:{radius},{lat},{lng})["historic"];',
    ],
    "transport": [
        'node(around:{radius},{lat},{lng})["railway"="station"];',
        'node(around:{radius},{lat},{lng})["public_transport"="station"];',
        'node(around:{radius},{lat},{lng})["amenity"="ferry_terminal"];',
        'way(around:{radius},{lat},{lng})["public_transport"="station"];',
    ],
}

FALLBACK_PLACES = {
    "food": [
        ("Yaowarat Street Food", 13.7418, 100.5097, "street food"),
        ("Tha Maharaj Riverside", 13.7544, 100.4898, "riverside dining"),
        ("Siam Square Food Cluster", 13.7458, 100.5334, "restaurant"),
    ],
    "shopping": [
        ("Siam Paragon", 13.7462, 100.5347, "mall"),
        ("ICONSIAM", 13.7266, 100.5106, "mall"),
        ("Chatuchak Weekend Market", 13.7996, 100.5501, "market"),
    ],
    "attractions": [
        ("Wat Arun", 13.7437, 100.4889, "temple"),
        ("Grand Palace", 13.7500, 100.4913, "heritage"),
        ("Bangkok Art and Culture Centre", 13.7468, 100.5301, "museum"),
    ],
    "transport": [
        ("BTS Siam", 13.7456, 100.5341, "rail station"),
        ("MRT Wat Mangkon", 13.7421, 100.5090, "rail station"),
        ("Sathorn Pier", 13.7196, 100.5139, "pier"),
    ],
}


@router.get("/places/nearby", response_model=list[PlaceOut])
async def nearby_places(
    lat: float = Query(ge=5, le=21),
    lng: float = Query(ge=97, le=106),
    category: str = Query(default="food", pattern="^(food|shopping|attractions|transport)$"),
    radius: int = Query(default=900, ge=150, le=1800),
) -> list[PlaceOut]:
    places = await _fetch_overpass(lat, lng, category, radius)
    if not places:
        places = _fallback_places(lat, lng, category)
    return sorted(places, key=lambda item: item.distance_m or 999999)[:12]


async def _fetch_overpass(lat: float, lng: float, category: str, radius: int) -> list[PlaceOut]:
    filters = "\n  ".join(
        template.format(lat=lat, lng=lng, radius=radius) for template in CATEGORY_FILTERS[category]
    )
    query = f"""
    [out:json][timeout:8];
    (
      {filters}
    );
    out center tags 40;
    """
    try:
        async with httpx.AsyncClient(timeout=9.0, headers={"User-Agent": "SawasdeeTransitHackathon/0.1"}) as client:
            response = await client.post(OVERPASS_URL, data={"data": query})
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    seen: set[str] = set()
    places: list[PlaceOut] = []
    for element in payload.get("elements", []):
        tags: dict[str, Any] = element.get("tags") or {}
        name = tags.get("name:en") or tags.get("name")
        if not name:
            continue

        poi_lat = element.get("lat") or (element.get("center") or {}).get("lat")
        poi_lng = element.get("lon") or (element.get("center") or {}).get("lon")
        if poi_lat is None or poi_lng is None:
            continue

        key = f"{name}:{round(float(poi_lat), 5)}:{round(float(poi_lng), 5)}"
        if key in seen:
            continue
        seen.add(key)

        kind = tags.get("tourism") or tags.get("amenity") or tags.get("shop") or tags.get("railway") or tags.get("historic")
        places.append(
            PlaceOut(
                id=f"osm-{element.get('type', 'node')}-{element.get('id')}",
                name=name,
                category=category,
                kind=kind,
                latitude=float(poi_lat),
                longitude=float(poi_lng),
                address=_format_address(tags),
                distance_m=_distance_m(lat, lng, float(poi_lat), float(poi_lng)),
            )
        )

    return places


def _format_address(tags: dict[str, Any]) -> str | None:
    parts = [tags.get("addr:street"), tags.get("addr:subdistrict"), tags.get("addr:district")]
    return ", ".join(part for part in parts if part) or None


def _fallback_places(lat: float, lng: float, category: str) -> list[PlaceOut]:
    return [
        PlaceOut(
            id=f"fallback-{category}-{index}",
            name=name,
            category=category,
            kind=kind,
            latitude=poi_lat,
            longitude=poi_lng,
            source="Curated fallback",
            distance_m=_distance_m(lat, lng, poi_lat, poi_lng),
        )
        for index, (name, poi_lat, poi_lng, kind) in enumerate(FALLBACK_PLACES[category], start=1)
    ]


def _distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    radius = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return int(radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
