import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Badge,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI, userAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, debounce } from '../utils/helpers';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [editMessage, setEditMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId, before) => {
    try {
      const response = await messageAPI.getMessages(conversationId, {
        before,
        limit: 50
      });
      if (before) {
        setMessages(prev => [...response.data.messages, ...prev]);
      } else {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollTop === 0 && messages.length > 0) {
      fetchMessages(selectedConversation._id, messages[0].createdAt);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      const response = await messageAPI.sendMessage(selectedConversation._id, {
        content: messageInput
      });
      setMessages(prev => [...prev, response.data.message]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEditMessage = async () => {
    if (!editMessage || !messageInput.trim()) return;

    try {
      const response = await messageAPI.editMessage(editMessage._id, {
        content: messageInput
      });
      setMessages(prev => prev.map(msg => 
        msg._id === response.data.message._id ? response.data.message : msg
      ));
      setEditMessage(null);
      setMessageInput('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await messageAPI.deleteMessage(selectedMessage._id);
      setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    handleCloseMenu();
  };

  const searchUsers = debounce(async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.users.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }, 300);

  const startConversation = async (userId) => {
    try {
      const response = await messageAPI.startConversation(userId);
      setConversations(prev => [response.data.conversation, ...prev]);
      setSelectedConversation(response.data.conversation);
      setNewConversationOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleOpenMenu = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleStartEdit = (message) => {
    setEditMessage(message);
    setMessageInput(message.content);
    handleCloseMenu();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Messages</Typography>
              <IconButton onClick={() => setNewConversationOpen(true)}>
                <AddIcon />
              </IconButton>
            </Box>
            <Divider />
            <List sx={{ overflow: 'auto', flexGrow: 1 }}>
              {conversations.map(conversation => (
                <ListItemButton
                  key={conversation._id}
                  selected={selectedConversation?._id === conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={conversation.unreadCount}
                      color="primary"
                      invisible={!conversation.unreadCount}
                    >
                      <Avatar src={conversation.participants[0].profilePicture} />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${conversation.participants[0].firstName} ${conversation.participants[0].lastName}`}
                    secondary={conversation.lastMessage?.content || 'No messages yet'}
                    primaryTypographyProps={{
                      variant: 'subtitle1',
                      color: conversation.unreadCount ? 'primary' : 'textPrimary'
                    }}
                    secondaryTypographyProps={{
                      noWrap: true
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Messages Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                  <Avatar src={selectedConversation.participants[0].profilePicture} sx={{ mr: 2 }} />
                  <Typography variant="h6">
                    {`${selectedConversation.participants[0].firstName} ${selectedConversation.participants[0].lastName}`}
                  </Typography>
                </Box>

                {/* Messages List */}
                <Box
                  ref={messageListRef}
                  onScroll={handleScroll}
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {messages.map(message => (
                    <Box
                      key={message._id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.sender._id === user._id ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 1
                        }}
                      >
                        {message.sender._id !== user._id && (
                          <Avatar
                            src={message.sender.profilePicture}
                            sx={{ width: 32, height: 32 }}
                          />
                        )}
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: message.sender._id === user._id ? 'primary.main' : 'grey.100',
                            color: message.sender._id === user._id ? 'white' : 'inherit',
                            maxWidth: '70%'
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                        </Paper>
                        {message.sender._id === user._id && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, message)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ mt: 0.5, ml: message.sender._id !== user._id ? 5 : 0 }}
                      >
                        {formatDate(new Date(message.createdAt))}
                        {message.isEdited && ' (edited)'}
                      </Typography>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box
                  component="form"
                  onSubmit={editMessage ? handleEditMessage : handleSendMessage}
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <IconButton size="small">
                    <AttachFileIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={editMessage ? 'Edit message...' : 'Type a message...'}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    multiline
                    maxRows={4}
                  />
                  <IconButton type="submit" color="primary">
                    <SendIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 3
                }}
              >
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Select a conversation or start a new one
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setNewConversationOpen(true)}
                >
                  New Conversation
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Conversation Dialog */}
      <Dialog
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Search users"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            sx={{ mt: 1 }}
          />
          <List>
            {searchResults.map(user => (
              <ListItem
                key={user._id}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => startConversation(user._id)}
                  >
                    Message
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.profilePicture} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleStartEdit(selectedMessage)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Messages;
