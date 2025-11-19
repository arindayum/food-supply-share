import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// This is a common fix for a known issue with React-Leaflet and Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const MapView = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null); // Start with null position

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPosition = [pos.coords.latitude, pos.coords.longitude];
        setPosition(userPosition);
        
        // Fetch posts based on user location
        const fetchNearbyPosts = async () => {
          try {
            const { data } = await axios.get('/api/posts', {
              params: { lat: userPosition[0], lng: userPosition[1], radiusKm: 20 }, // 20km radius for map
            });
            setPosts(data);
          } catch (err) {
            setError('Failed to fetch nearby posts for the map.');
          } finally {
            setLoading(false);
          }
        };
        fetchNearbyPosts();
      },
      () => {
        setError('Geolocation is not available. Cannot display nearby posts on the map.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!position) return <Alert variant="info">Waiting for your location...</Alert>;

  return (
    <MapContainer center={position} zoom={13} style={{ height: '75vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {posts.map(post => (
        <Marker key={post._id} position={[post.location.coordinates[1], post.location.coordinates[0]]}>
          <Popup>
            <h5>{post.title}</h5>
            <p className="mb-1">By: {post.owner.name}</p>
            <p className="mb-2">Expires: {new Date(post.expiresAt).toLocaleDateString()}</p>
            <Link to={`/posts/${post._id}`}>
                <Button variant="primary" size="sm">View Post</Button>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
