import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';

const defaultPosts = [
  {
    id: 1,
    content: "Just completed my certification in Cloud Computing! Looking forward to connecting with fellow alumni in the tech industry.",
    author: "John Doe",
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    content: "Excited to announce our upcoming Alumni Networking Event next month! Stay tuned for more details.",
    author: "Jane Smith",
    timestamp: "5 hours ago"
  }
];

const CreatePostDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Example Posts</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {defaultPosts.map((post) => (
            <Box key={post.id} sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                {post.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posted by {post.author} • {post.timestamp}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostDialog;
