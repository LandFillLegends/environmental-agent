
import ipaddress
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

DEV_FALLBACK_LOCATION = "Marietta, GA 30062, US"

def is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False

async def get_location_from_ip(ip: str) -> Optional[str]:
    logger.info("Location lookup requested for IP: %s", ip)

    if is_private_ip(ip):
        logger.info("IP %s is private — using dev fallback location: %s", ip, DEV_FALLBACK_LOCATION)
        return DEV_FALLBACK_LOCATION

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://ipinfo.io/{ip}/json", timeout=3.0)
            data = response.json()
            logger.debug("ipinfo.io raw response for %s: %s", ip, data)

            city = data.get("city")
            region = data.get("region")
            postal = data.get("postal")
            country = data.get("country")

            if city and region:
                location = f"{city}, {region}"
                if postal:
                    location += f" {postal}"
                if country:
                    location += f", {country}"
                logger.info("Resolved IP %s → location: %s", ip, location)
                return location
            else:
                logger.warning("ipinfo.io response for IP %s missing city/region — city=%r region=%r", ip, city, region)
    except Exception as e:
        logger.error("Location lookup failed for IP %s: %s", ip, e, exc_info=True)

    logger.warning("Could not resolve location for IP %s — returning None", ip)
    return None
