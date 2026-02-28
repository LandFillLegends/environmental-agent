
import ipaddress
import httpx

DEV_FALLBACK_LOCATION = "Marietta, GA 30062, US"

def is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False

async def get_location_from_ip(ip: str) -> str | None:
    if is_private_ip(ip):
        return DEV_FALLBACK_LOCATION
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://ipinfo.io/{ip}/json", timeout=3.0)
            data = response.json()
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
                return location
    except Exception:
        pass
    return None