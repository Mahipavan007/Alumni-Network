import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <CircularProgress size={50} />
      <Typography variant="body1" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
