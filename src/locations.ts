export interface LocationOption {
  label: string   // what you see in the dropdown
  value: string   // what goes into the Google search
}

const CITIES = [
  'Atlanta', 'Austin', 'Boise', 'Boston', 'Chicago', 'Columbus', 'Dallas',
  'Denver', 'Detroit', 'Houston', 'Los Angeles', 'Miami', 'Minneapolis',
  'Nashville', 'New York', 'Philadelphia', 'Phoenix', 'Pittsburgh',
  'Portland', 'Raleigh', 'Salt Lake City', 'San Diego', 'San Francisco',
  'San Jose', 'Seattle', 'Washington DC',
]

export const LOCATIONS: LocationOption[] = [
  { label: 'Remote', value: 'Remote' },
  ...CITIES.map(city => ({ label: city, value: city })),
]
