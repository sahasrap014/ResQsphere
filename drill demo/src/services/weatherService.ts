import { WeatherData } from '../types/disaster';

// WMO Weather interpretation codes
function decodeWmo(code: number): string {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
    case 2:
    case 3:
      return 'Mainly Clear / Partly Cloudy';
    case 45:
    case 48:
      return 'Fog & Depositing Rime Fog';
    case 51:
    case 53:
    case 55:
      return 'Drizzle (Light to Dense)';
    case 61:
    case 63:
    case 65:
      return 'Rain (Slight to Heavy)';
    case 71:
    case 73:
    case 75:
      return 'Snow Fall';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers (Violent)';
    case 95:
      return 'Thunderstorm with Strong Winds';
    case 96:
    case 99:
      return 'Severe Thunderstorm with Hail';
    default:
      return 'Overcast / Precipitation';
  }
}

export async function fetchLiveWeather(
  lat: number = 16.9891,
  lng: number = 81.784,
  locationName: string = 'Rajahmundry / Godavari Basin'
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API returned status ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  const hourly = data.hourly;

  const forecast = [];
  if (hourly && hourly.time) {
    for (let i = 0; i < Math.min(6, hourly.time.length); i++) {
      const timeStr = new Date(hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      forecast.push({
        time: timeStr,
        temp: Math.round(hourly.temperature_2m[i]),
        precipitation: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
        condition: decodeWmo(hourly.weather_code[i]),
      });
    }
  }

  return {
    city: locationName,
    district: 'East Godavari Basin / Coastal AP',
    temp: Math.round(current.temperature_2m),
    apparentTemp: Math.round(current.apparent_temperature),
    condition: decodeWmo(current.weather_code),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isLive: true,
    statusMessage: 'Live Telemetry · Open-Meteo Meteorological Service',
    forecast,
  };
}

export const DEMO_WEATHER: WeatherData = {
  city: 'East Godavari Simulation Sector',
  district: 'Godavari Lower Delta Emergency Zone',
  temp: 26,
  apparentTemp: 29,
  condition: 'Torrential Rain Showers & Gusts',
  humidity: 94,
  windSpeed: 48,
  precipitation: 182.5,
  weatherCode: 82,
  lastUpdated: '10:30 AM (Simulation Sync)',
  isLive: false,
  statusMessage: 'Simulated Scenario Telemetry · Fictional 180mm Monsoon Surge',
  forecast: [
    { time: '11:00 AM', temp: 26, precipitation: 95, condition: 'Heavy Rain Showers' },
    { time: '01:00 PM', temp: 25, precipitation: 90, condition: 'Continuous Downpour' },
    { time: '03:00 PM', temp: 25, precipitation: 85, condition: 'Severe Thunderstorm' },
    { time: '05:00 PM', temp: 26, precipitation: 70, condition: 'Rain & Wind Gusts' },
    { time: '07:00 PM', temp: 25, precipitation: 60, condition: 'Intermittent Showers' },
    { time: '09:00 PM', temp: 24, precipitation: 45, condition: 'Light to Moderate Rain' },
  ],
};
