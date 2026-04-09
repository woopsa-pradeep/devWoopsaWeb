# Route Map Component (बिना Google API के)

यह component Google Maps API के बिना route और markers को map पर display करता है। यह **Leaflet** और **OpenStreetMap** का उपयोग करता है, जिसके लिए कोई API key की जरूरत नहीं है।

## Features

- ✅ **No API Key Required** - OpenStreetMap tiles का उपयोग करता है
- ✅ **Polyline Decoding** - Google Maps polyline format को decode करता है
- ✅ **Route Visualization** - Route को polyline के रूप में दिखाता है
- ✅ **Markers** - Start, End, और Stop markers
- ✅ **Info Panel** - Route information और stops की details
- ✅ **Responsive** - Mobile और desktop दोनों पर काम करता है

## Files Created

1. **`public/route-map-standalone.html`** - Standalone HTML file (direct browser में open करें)
2. **`src/component/molecules/RouteMap.tsx`** - React component (project में use करें)
3. **`src/component/molecules/RouteMapExample.tsx`** - Usage example

## Usage

### Option 1: Standalone HTML File

सीधे browser में open करें:
```
http://localhost:3000/route-map-standalone.html
```

या file को directly browser में open करें।

### Option 2: React Component

```tsx
import RouteMap from './component/molecules/RouteMap';

// Your API response data
const apiResponse = {
  data: {
    route: {
      polyline: "u|qsEbxpvNKOGq@Mu@Om@...", // Your encoded polyline
      totalDistanceKm: 23.29,
      lastStopToDestinationKm: 5.087
    },
    optimizedStops: [
      {
        stopSequence: 1,
        C_Number: 34008,
        orderNumbers: 123122,
        lat: 34.8798872,
        lng: -82.5828101,
        distanceKm: 14.804,
        cumulativeDistanceKm: 14.804
      },
      // ... more stops
    ]
  }
};

// Use the component
<RouteMap
  route={apiResponse.data.route}
  optimizedStops={apiResponse.data.optimizedStops}
  height="600px"
  width="100%"
  showInfoPanel={true}
/>
```

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `route` | `RouteData` | Yes | - | Route data with polyline and distances |
| `optimizedStops` | `OptimizedStop[]` | Yes | - | Array of stop locations |
| `height` | `string` | No | `'100%'` | Map container height |
| `width` | `string` | No | `'100%'` | Map container width |
| `showInfoPanel` | `boolean` | No | `true` | Show/hide info panel |

## Data Structure

### RouteData
```typescript
interface RouteData {
  polyline: string;              // Encoded polyline string
  totalDistanceKm: number;       // Total route distance
  lastStopToDestinationKm: number; // Distance from last stop to destination
}
```

### OptimizedStop
```typescript
interface OptimizedStop {
  stopSequence: number;          // Stop order number
  C_Number: number;              // Customer number
  orderNumbers: number;          // Order numbers
  lat: number;                   // Latitude
  lng: number;                   // Longitude
  distanceKm: number;            // Distance to this stop
  cumulativeDistanceKm: number;  // Cumulative distance
}
```

## How It Works

1. **Polyline Decoding**: `@mapbox/polyline` library का उपयोग करके encoded polyline को decode किया जाता है
2. **Map Rendering**: Leaflet library OpenStreetMap tiles load करती है
3. **Route Drawing**: Decoded coordinates से polyline बनाई जाती है
4. **Markers**: Start (green), End (red), और Stops (orange) markers add किए जाते हैं
5. **Bounds**: Map automatically सभी points को fit करता है

## Dependencies

कोई npm package install करने की जरूरत नहीं है! सभी libraries CDN से load होती हैं:
- Leaflet (via CDN)
- @mapbox/polyline (via CDN)

## Customization

### Marker Colors
`RouteMap.tsx` में marker colors change कर सकते हैं:
- Start marker: `#4CAF50` (green)
- End marker: `#f44336` (red)
- Stop markers: `#FF9800` (orange)

### Route Line Style
Polyline style change करने के लिए:
```tsx
window.L.polyline(path, {
  color: '#3388ff',    // Line color
  weight: 5,           // Line width
  opacity: 0.9,        // Line opacity
  smoothFactor: 1,     // Smoothness
}).addTo(map);
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Notes

- OpenStreetMap tiles free हैं और कोई API key की जरूरत नहीं
- Offline mode में काम नहीं करेगा (tiles internet से load होती हैं)
- High traffic के लिए अपना tile server use करना better होगा

## Troubleshooting

### Map नहीं दिख रहा
- Browser console में errors check करें
- Internet connection verify करें
- Leaflet CSS properly load हो रहा है या नहीं check करें

### Polyline decode नहीं हो रहा
- Polyline string valid है या नहीं verify करें
- `@mapbox/polyline` library properly load हो रही है या नहीं check करें

### Markers नहीं दिख रहे
- Lat/lng values valid हैं या नहीं check करें
- Browser console में errors check करें

## Example Integration

```tsx
// In your component/page
import { useEffect, useState } from 'react';
import RouteMap from './component/molecules/RouteMap';
import { fetchRouteData } from './api/routes'; // Your API call

const DeliveryRoutePage = () => {
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    fetchRouteData().then(response => {
      setRouteData(response.data);
    });
  }, []);

  if (!routeData) return <div>Loading...</div>;

  return (
    <div style={{ height: '100vh' }}>
      <RouteMap
        route={routeData.route}
        optimizedStops={routeData.optimizedStops}
        height="100%"
      />
    </div>
  );
};
```

## License

OpenStreetMap data © OpenStreetMap contributors, licensed under ODbL.
Leaflet © Vladimir Agafonkin, licensed under BSD 2-Clause License.
