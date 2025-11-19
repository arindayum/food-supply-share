// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   Container,
//   Card,
//   Spinner,
//   Alert,
//   Button,
//   Table,
//   Badge,
//   ButtonGroup,
// } from 'react-bootstrap';
// import { Link } from 'react-router-dom';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';


// const MyPostsPage = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchMyPosts = async () => {
//       try {
//         setLoading(true);
//         const { data } = await axios.get('/api/posts/my-posts');
//         setPosts(data);
//       } catch (err) {
//         const message = err.response?.data?.message || 'Failed to fetch your posts.';
//         setError(message);
//         toast.error(message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMyPosts();
//   }, []);

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to permanently delete this post?')) {
//       try {
//         await axios.delete(`/api/posts/${id}`);
//         setPosts(posts.filter(p => p._id !== id));
//         toast.success('Post deleted successfully!');
//       } catch (err) {
//         const message = err.response?.data?.message || 'Failed to delete post.';
//         setError(message);
//         toast.error(message);
//       }
//     }
//   };

//   return (
//     <Container>
//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
//       <div className="d-flex justify-content-between align-items-center my-4">
//         <h1 className="fw-bold">My Posts</h1>
//         <Link to="/posts/create" className="btn btn-primary">
//           <i className="fas fa-plus me-2"></i>Create New Post
//         </Link>
//       </div>
      
//       {loading ? <div className="text-center"><Spinner animation="border" /></div> : 
//        error ? <Alert variant="danger">{error}</Alert> : 
//        posts.length > 0 ? (
//         <Card className="shadow-sm">
//           <Table responsive hover className="align-middle mb-0">
//             <thead className="bg-light">
//               <tr>
//                 <th className="ps-3">Title</th>
//                 <th>Status</th>
//                 <th>Expires On</th>
//                 <th className="text-end pe-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {posts.map((post) => (
//                 <tr key={post._id}>
//                   <td className="ps-3">{post.title}</td>
//                   <td>
//                     <Badge bg={post.status === 'available' ? 'success' : 'secondary'}>{post.status}</Badge>
//                   </td>
//                   <td>{new Date(post.expiresAt).toLocaleDateString()}</td>
//                   <td className="text-end pe-3">
//                     <ButtonGroup>
//                       <Link to={`/posts/${post._id}`} className="btn btn-outline-secondary btn-sm">
//                         <i className="fas fa-eye"></i>
//                       </Link>
//                       <Link to={`/posts/edit/${post._id}`} className="btn btn-outline-primary btn-sm">
//                         <i className="fas fa-edit"></i>
//                       </Link>
//                       <Button variant="outline-danger" size="sm" onClick={() => handleDelete(post._id)}>
//                         <i className="fas fa-trash"></i>
//                       </Button>
//                     </ButtonGroup>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </Card>
//       ) : (
//         <Alert variant="info">
//           You haven't created any posts yet. <Link to="/posts/create">Create one now!</Link>
//         </Alert>
//       )}
//     </Container>
//   );
// };

// export default MyPostsPage;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Card,
  Spinner,
  Alert,
  Button,
  Badge,
  ButtonGroup,
} from 'react-bootstrap';
import Table from 'react-bootstrap/Table';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/posts/my-posts');
        setPosts(data);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Failed to fetch your posts.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this post?')) {
      try {
        await axios.delete(`/api/posts/${id}`);
        setPosts((prev) => prev.filter((p) => p._id !== id));
        toast.success('Post deleted successfully!');
      } catch (err) {
        const message =
          err.response?.data?.message || 'Failed to delete post.';
        setError(message);
        toast.error(message);
      }
    }
  };

  return (
    <Container>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="d-flex justify-content-between align-items-center my-4">
        <h1 className="fw-bold">My Posts</h1>
        <Link to="/posts/create" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Create New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : posts.length > 0 ? (
        <Card className="shadow-sm">
          <Table responsive hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-3">Title</th>
                <th>Status</th>
                <th>Expires On</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td className="ps-3">{post.title}</td>
                  <td>
                    <Badge
                      bg={
                        post.status === 'available'
                          ? 'success'
                          : post.status === 'claimed'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td>
                    {post.expiresAt
                      ? new Date(post.expiresAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="text-end pe-3">
                    <ButtonGroup>
                      <Link
                        to={`/posts/${post._id}`}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <Link
                        to={`/posts/edit/${post._id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(post._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Alert variant="info">
          You haven&apos;t created any posts yet.{' '}
          <Link to="/posts/create">Create one now!</Link>
        </Alert>
      )}
    </Container>
  );
};

export default MyPostsPage;
