import asyncio
from agent import geocode_destination, fetch_overpass_spots

async def test():
    d = await geocode_destination('hà giang')
    print('Geocode:', d)
    if d:
        s = await fetch_overpass_spots(d['center'][0], d['center'][1])
        print('Spots:', len(s), s)

asyncio.run(test())
