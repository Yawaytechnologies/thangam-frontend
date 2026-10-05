export function propertyMap(location?: string) {
  const raw = location?.trim();
  if (!raw) return null;
  let query = raw;
  let openUrl: string | undefined;
  let embedUrl: string | undefined;
  let placeId: string | undefined;
  if (/^[a-z][a-z\d+.-]*:/i.test(raw)) {
    let url: URL;
    try { url = new URL(raw); } catch { return null; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const google = ['google.com', 'www.google.com', 'maps.google.com', 'google.co.in', 'www.google.co.in'].includes(url.hostname);
    const short = url.hostname === 'maps.app.goo.gl' || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/'));
    if (!google && !short) return null;
    url.protocol = 'https:';
    openUrl = url.href;
    placeId = url.searchParams.get('destination_place_id') || url.searchParams.get('query_place_id') || undefined;
    if (google && url.pathname === '/maps/embed' && url.searchParams.has('pb')) embedUrl = url.href;
    const directions = url.pathname.startsWith('/maps/dir');
    const pins = [...url.pathname.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
    const pin = directions ? pins[pins.length - 1] : pins[0];
    query = short ? '' : url.searchParams.get('destination') || (pin ? `${pin[1]},${pin[2]}` : url.searchParams.get('query') || url.searchParams.get('q') || '');
    if (!query && google && directions) {
      // Route URLs contain origin/destination followed by camera and metadata.
      // The camera's @coordinates are not the selected property's coordinates.
      const stops = url.pathname.slice('/maps/dir'.length).split('/').filter(Boolean);
      const destinations = [];
      for (const stop of stops) {
        if (stop.startsWith('@') || stop.startsWith('data=') || stop.startsWith('!')) break;
        destinations.push(stop);
      }
      const destination = destinations[destinations.length - 1];
      if (destination) { try { query = decodeURIComponent(destination).replace(/\+/g, ' '); } catch { query = ''; } }
    }
    if (!query && google) {
      const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
      if (place) { try { query = decodeURIComponent(place[1]).replace(/\+/g, ' '); } catch { query = ''; } }
    }
  } else if (/[<>]/.test(raw) || raw.startsWith('//')) return null;
  if (query) {
    const coordinates = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinates && (Math.abs(Number(coordinates[1])) > 90 || Math.abs(Number(coordinates[2])) > 180)) return null;
  }
  const encoded = encodeURIComponent(query);
  const pinUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}${placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : ''}`;
  return {
    embedUrl: embedUrl || (query ? `https://www.google.com/maps?q=${encoded}&output=embed` : undefined),
    openUrl: query ? pinUrl : openUrl || pinUrl,
    directionsUrl: query ? `https://www.google.com/maps/dir/?api=1&destination=${encoded}${placeId ? `&destination_place_id=${encodeURIComponent(placeId)}` : ''}` : undefined,
  };
}
