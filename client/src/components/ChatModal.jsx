
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, ListGroup, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import  {useSocket}  from '../hooks/useSocket'; // custom hook for socket

const ChatModal = ({ show, handleClose, postId, postModel }) => {
  const { user } = useAuth();
  const { socket, isConnected, error: socketError } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  // Load chat history when modal opens
  useEffect(() => {
    if (!show || !postId) return;

    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        setError('');

        // adjust this API path to match your backend
        const { data } = await axios.get(`/api/chat/${postModel}/${postId}`);
        setMessages(data || []);
      } catch (err) {
        console.error(err);
        setError('Could not load chat history.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [show, postId, postModel]);

  // Join socket room + listen for new messages
  useEffect(() => {
    if (!show || !socket || !isConnected || !postId) return;

    // join specific chat room
    socket.emit('joinChatRoom', postId);

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leaveChatRoom', postId);
    };
  }, [show, socket, isConnected, postId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    const conversationId =
      messages.length > 0 ? messages[0].conversationId : null;

    socket.emit('sendMessage', {
      conversationId,
      text: newMessage,
      roomId: postId,
      postModel: postModel || 'FoodPost',
    });

    setNewMessage('');
  };

  const onClose = () => {
    setMessages([]);
    setNewMessage('');
    setError('');
    handleClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chat about Post</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ height: '50vh', display: 'flex', flexDirection: 'column' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        {socketError && (
          <Alert variant="warning">
            Real-time chat unavailable: {socketError}
          </Alert>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <ListGroup variant="flush">
              {messages.map((msg) => (
                <ListGroup.Item
                  key={msg._id || Math.random()}
                  className={`d-flex ${
                    msg.sender?._id === user?._id ? 'justify-content-end' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded ${
                      msg.sender?._id === user?._id
                        ? 'bg-primary text-white'
                        : 'bg-light'
                    }`}
                  >
                    <div className="fw-bold">
                      {msg.sender?.name || 'User'}
                    </div>
                    <div>{msg.text}</div>
                    <div
                      className="text-muted mt-1"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString()
                        : ''}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
              <div ref={messagesEndRef} />
            </ListGroup>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Form onSubmit={handleSendMessage} className="w-100 d-flex">
          <Form.Control
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoFocus
          />
          <Button variant="primary" type="submit" className="ms-2">
            Send
          </Button>
        </Form>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatModal;
