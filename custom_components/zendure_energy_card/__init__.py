"""Zendure Energy Card resource helper."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

DOMAIN = "zendure_energy_card"
VERSION = "0.2.0"
RESOURCE_URL = f"/{DOMAIN}/zendure-energy-card.js"
RESOURCE_URL_VERSIONED = f"{RESOURCE_URL}?v={VERSION}"


async def async_setup(hass: HomeAssistant, _config: dict) -> bool:
    """Set up the resource helper and register the Lovelace card."""
    static_dir = Path(__file__).parent / "static"

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                RESOURCE_URL,
                str(static_dir),
                cache_headers=False,
            )
        ]
    )

    lovelace = hass.data.get("lovelace")
    resources = lovelace.resources if lovelace else None
    if resources is not None:
        if not resources.loaded:
            await resources.async_load()

        existing = None
        for item in resources.async_items():
            url = item.get("url", "")
            if url.split("?", 1)[0] == RESOURCE_URL:
                existing = item
                break

        if existing is None:
            await resources.async_create_item(
                {
                    "res_type": "module",
                    "url": RESOURCE_URL_VERSIONED,
                }
            )
        elif existing.get("url") != RESOURCE_URL_VERSIONED:
            resource_id = existing.get("id")
            if resource_id is not None and hasattr(resources, "async_update_item"):
                await resources.async_update_item(
                    resource_id,
                    {
                        "res_type": "module",
                        "url": RESOURCE_URL_VERSIONED,
                    },
                )

    return True
