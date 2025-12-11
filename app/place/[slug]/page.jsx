import locations from "../../../data/locations.json";

export default async function PlacePage({ params }) {
  const { slug } = await params;   // <-- IMPORTANT

  const place = locations.find((loc) => loc.slug === slug);

  if (!place) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Location not found</h1>
        <p>Slug received: {slug}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>{place.name}</h1>
      <img
        src={place.image}
        alt={place.name}
        style={{ width: 400, borderRadius: 10 }}
      />
      <p style={{ marginTop: 20 }}>{place.description}</p>
    </div>
  );
}
