import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const SkillsSection = ({ skills = [], onAddSkill, onEndorseSkill, currentUserId, userId }) => {
  const [open, setOpen] = React.useState(false);
  const [newSkill, setNewSkill] = React.useState({
    name: '',
    level: 'intermediate',
    category: 'technical'
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    onAddSkill(newSkill);
    setNewSkill({ name: '', level: 'intermediate', category: 'technical' });
    handleClose();
  };

  const skillLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'default';
      case 'intermediate': return 'info';
      case 'advanced': return 'warning';
      case 'expert': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Skills & Expertise</Typography>
          {currentUserId === userId && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleOpen}
              variant="outlined"
              size="small"
            >
              Add Skill
            </Button>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1}>
          {skills.map((skill, index) => (
            <Box key={index} sx={{ position: 'relative', mb: 1 }}>
              <Chip
                label={skill.name}
                color={skillLevelColor(skill.level)}
                variant="outlined"
                onClick={() => currentUserId !== userId && onEndorseSkill(skill)}
                sx={{ pr: 4 }}
              />
              <Chip
                size="small"
                label={`${skill.endorsements?.length || 0}`}
                sx={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  height: 20,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
          ))}
        </Box>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add New Skill</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                autoFocus
                margin="dense"
                label="Skill Name"
                fullWidth
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Proficiency Level</InputLabel>
                <Select
                  value={newSkill.level}
                  label="Proficiency Level"
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Category</InputLabel>
                <Select
                  value={newSkill.category}
                  label="Category"
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                >
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="soft">Soft Skills</MenuItem>
                  <MenuItem value="language">Language</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={!newSkill.name}>
              Add Skill
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SkillsSection;
