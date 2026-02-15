import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Healing as HealingIcon,
  Psychology as PsychologyIcon,
  SportsMartialArts as DetoxIcon,
  School as SchoolIcon,
  Work as WorkIcon
} from '@mui/icons-material';

const Interventions = () => {
  const [offenders, setOffenders] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [interventionData, setInterventionData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    provider: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch recommended offenders (#5)
      const offendersQuery = query(
        collection(db, 'offenders'),
        where('recommendedForCS', '==', true)
      );
      const offendersSnapshot = await getDocs(offendersQuery);
      const offendersList = [];
      offendersSnapshot.forEach((doc) => {
        offendersList.push({ id: doc.id, ...doc.data() });
      });
      setOffenders(offendersList);

      // Fetch existing interventions
      const interventionsSnapshot = await getDocs(collection(db, 'interventions'));
      const interventionsList = [];
      interventionsSnapshot.forEach((doc) => {
        interventionsList.push({ id: doc.id, ...doc.data() });
      });
      setInterventions(interventionsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAssignIntervention = async () => {
    try {
      const newIntervention = {
        offenderId: selectedOffender.id,
        offenderName: `${selectedOffender.firstName} ${selectedOffender.lastName}`,
        ...interventionData,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'interventions'), newIntervention);

      // Update offender record
      await updateDoc(doc(db, 'offenders', selectedOffender.id), {
        hasIntervention: true,
        interventionType: interventionData.type
      });

      setOpenDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error assigning intervention:', error);
    }
  };

  const getInterventionIcon = (type) => {
    switch (type) {
      case 'counseling':
        return <PsychologyIcon />;
      case 'detox':
        return <DetoxIcon />;
      case 'education':
        return <SchoolIcon />;
      case 'vocational':
        return <WorkIcon />;
      default:
        return <HealingIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tailored Interventions (#5)
      </Typography>

      <Grid container spacing={3}>
        {/* Offenders needing intervention */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Offenders Needing Intervention
            </Typography>
            <Grid container spacing={2}>
              {offenders.filter(o => !o.hasIntervention).map((offender) => (
                <Grid item xs={12} key={offender.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {offender.firstName} {offender.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Risk Level: {offender.riskLevel}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {offender.substanceAbuse && (
                          <Chip label="Substance Abuse" size="small" sx={{ mr: 1 }} />
                        )}
                        {offender.mentalHealthIssues && (
                          <Chip label="Mental Health" size="small" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedOffender(offender);
                          setOpenDialog(true);
                        }}
                      >
                        Assign Intervention
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Active interventions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Interventions
            </Typography>
            <Grid container spacing={2}>
              {interventions.filter(i => i.status === 'active').map((intervention) => (
                <Grid item xs={12} key={intervention.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        {getInterventionIcon(intervention.type)}
                        <Typography variant="subtitle1" sx={{ ml: 1 }}>
                          {intervention.offenderName}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        Type: {intervention.type}
                      </Typography>
                      <Typography variant="body2">
                        Provider: {intervention.provider}
                      </Typography>
                      <Typography variant="body2">
                        Start Date: {new Date(intervention.startDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Intervention Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Intervention</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Intervention Type</InputLabel>
                <Select
                  value={interventionData.type}
                  onChange={(e) => setInterventionData({...interventionData, type: e.target.value})}
                >
                  <MenuItem value="counseling">Counseling</MenuItem>
                  <MenuItem value="detox">Detoxification</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="vocational">Vocational Training</MenuItem>
                  <MenuItem value="mental">Mental Health Support</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={interventionData.startDate}
                onChange={(e) => setInterventionData({...interventionData, startDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={interventionData.endDate}
                onChange={(e) => setInterventionData({...interventionData, endDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Provider"
                value={interventionData.provider}
                onChange={(e) => setInterventionData({...interventionData, provider: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={interventionData.notes}
                onChange={(e) => setInterventionData({...interventionData, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignIntervention} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Interventions;