import { Container } from 'react-bootstrap';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import MyPostsPage from './pages/MyPostsPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import PostDetailsPage from './pages/PostDetailsPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import ChatsPage from './pages/ChatsPage';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="py-4 flex-grow-1">
        <Container>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/posts/:id" element={<PostDetailsPage />} />

            {/* Protected Routes */}
            <Route path="" element={<PrivateRoute />}>
              <Route path="/my-posts" element={<MyPostsPage />} />
              <Route path="/posts/create" element={<CreatePostPage />} />
              <Route path="/posts/edit/:id" element={<EditPostPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chats" element={<ChatsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
                <Route path="" element={<AdminDashboardPage />} />
            </Route>
          </Routes>
        </Container>
      </main>
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <Container>
          <p className="mb-0">&copy; 2025 Food Supply. All Rights Reserved.</p>
        </Container>
      </footer>
    </div>
  );
}

export default App;
