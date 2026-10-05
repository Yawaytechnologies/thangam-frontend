import { describe, expect, it } from 'vitest';
import { propertyMap } from './property-map';

describe('property map locations', () => {
  it('opens the saved directions destination as a pin rather than a route', () => {
    const map = propertyMap('https://www.google.com/maps/dir//Malkoha+-+Appaswamy+Real+Estates+Ltd,+Velachery+Main+Rd,+Guindy,+Chennai/@13.0208486,80.162,12z');
    const link = new URL(map!.openUrl);
    expect(link.pathname).toBe('/maps/search/');
    expect(link.searchParams.get('query')).toBe('Malkoha - Appaswamy Real Estates Ltd, Velachery Main Rd, Guindy, Chennai');
    expect(map?.embedUrl).not.toContain('13.0208486');
  });
  it('uses a directions destination and its place identity', () => {
    const map = propertyMap('https://www.google.com/maps/dir/?api=1&origin=Chennai&destination=13.1,80.2&destination_place_id=place123');
    expect(map?.openUrl).toBe('https://www.google.com/maps/search/?api=1&query=13.1%2C80.2&query_place_id=place123');
  });
  it('uses the destination pin in a route with multiple coordinate pairs', () => {
    expect(propertyMap('https://www.google.com/maps/dir/Origin/Destination/data=!3d12.0!4d79.0!3d13.1!4d80.2')?.openUrl).toContain('query=13.1%2C80.2');
  });
  it('builds a preview and directions from coordinates', () => {
    const map = propertyMap('13.0827, 80.2707');
    expect(map?.embedUrl).toContain('output=embed');
    expect(map?.directionsUrl).toContain('destination=13.0827%2C%2080.2707');
  });
  it('extracts the selected pin rather than the map camera position', () => {
    expect(propertyMap('https://www.google.com/maps/place/Plot/@12,79,15z/data=!3d13.1!4d80.2')?.embedUrl).toContain('q=13.1%2C80.2');
    expect(propertyMap('https://www.google.com/maps/place/Plot/@12,79,15z/data=!3d13.1!4d80.2')?.openUrl).toBe('https://www.google.com/maps/search/?api=1&query=13.1%2C80.2');
  });
  it('opens coordinate embed links as a Google Maps pin and retains place identities', () => {
    expect(propertyMap('https://www.google.com/maps?q=13.1,80.2&output=embed')?.openUrl).toBe('https://www.google.com/maps/search/?api=1&query=13.1%2C80.2');
    const map = propertyMap('https://www.google.com/maps/search/?api=1&query=Plot&query_place_id=place123');
    expect(map?.openUrl).toContain('query_place_id=place123');
    expect(map?.directionsUrl).toContain('destination_place_id=place123');
  });
  it('supports full query and shared embed links', () => {
    expect(propertyMap('https://www.google.com/maps/search/?api=1&query=Chennai')?.embedUrl).toContain('q=Chennai');
    expect(propertyMap('https://www.google.com/maps/embed?pb=example')?.embedUrl).toBe('https://www.google.com/maps/embed?pb=example');
  });
  it('keeps short links external without guessing a location', () => {
    const map = propertyMap('https://maps.app.goo.gl/example');
    expect(map?.openUrl).toBe('https://maps.app.goo.gl/example');
    expect(map?.embedUrl).toBeUndefined();
    expect(map?.directionsUrl).toBeUndefined();
  });
  it('rejects unsafe links, invalid coordinates and missing locations', () => {
    for (const value of ['', 'javascript:alert(1)', 'https://google.com.evil.test/maps', 'https://evil.test/map', '91,181', '<iframe src="test">']) expect(propertyMap(value)).toBeNull();
  });
});
