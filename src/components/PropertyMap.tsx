import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { propertyMap } from '../lib/property-map';

export default function PropertyMap({ location, name }: { location?: string; name: string }) {
  const map = propertyMap(location);
  return <section className="my-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <h3 className="flex items-center gap-2 font-bold text-gray-900"><MapPin className="h-5 w-5 text-gold" />Property Location</h3>
      {map && <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <a href={map.openUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-700 hover:underline">Open in Google Maps<ExternalLink className="h-4 w-4" /></a>
        {map.directionsUrl && <a href={map.directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-700 hover:underline"><Navigation className="h-4 w-4" />Get Directions</a>}
      </div>}
    </div>
    {map?.embedUrl ? <><iframe title={`Map location for ${name}`} src={map.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-80 w-full border-0" /><p className="px-4 py-2 text-xs text-gray-500">If the map does not load, use Open in Google Maps.</p></> : <p className="bg-slate-50 p-5 text-sm text-gray-500">{map ? 'Open the saved location in Google Maps. To display it here, save coordinates or the full Google Maps location URL instead of a shortened link.' : location ? 'Map preview unavailable. Save valid coordinates, an address, or a Google Maps location link.' : 'No map location has been added for this property yet.'}</p>}
  </section>;
}
