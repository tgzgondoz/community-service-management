import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
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
import {
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const RecommendedList = () => {
  const [recommendedOffenders, setRecommendedOffenders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    institution: '',
    startDate: '',
    endDate: '',
    hoursRequired: '',
    supervisor: ''
  });

  useEffect(() => {
    fetchRecommendedOffenders();
  }, []);

  const fetchRecommendedOffenders = async () => {
    try {
      const q = query(
        collection(db, 'offenders'),
        where('recommendedForCS', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const offendersList = [];
      querySnapshot.forEach((doc) => {
        offendersList.push({ id: doc.id, ...doc.data() });
      });
      setRecommendedOffenders(offendersList);
    } catch (error) {
      console.error('Error fetching recommended offenders:', error);
    }
  };

  const handleAssignInstitution = (offender) => {
    setSelectedOffender(offender);
    setOpenDialog(true);
  };

  const handleSubmitAssignment = async () => {
    try {
      // Create assignment
      await addDoc(collection(db, 'assignments'), {
        offenderId: selectedOffender.id,
        offenderName: `${selectedOffender.firstName} ${selectedOffender.lastName}`,
        ...assignmentData,
        status: 'new',
        notified: false,
        createdAt: new Date().toISOString(),
        assignedBy: auth.currentUser?.email
      });

      // Update offender status
      await updateDoc(doc(db, 'offenders', selectedOffender.id), {
        status: 'assigned',
        assignmentDate: new Date().toISOString()
      });

      // Add to activity log
      await addDoc(collection(db, 'activities'), {
        description: `Offender ${selectedOffender.firstName} ${selectedOffender.lastName} assigned to ${assignmentData.institution}`,
        timestamp: new Date().toISOString(),
        user: auth.currentUser?.email
      });

      setOpenDialog(false);
      fetchRecommendedOffenders();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Probationers Recommended for Community Service (#4)
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchRecommendedOffenders}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Recommended
                </Typography>
                <Typography variant="h3">
                  {recommendedOffenders.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Assignment
                </Typography>
                <Typography variant="h3">
                  {recommendedOffenders.filter(o => o.status !== 'assigned').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assigned
                </Typography>
                <Typography variant="h3">
                  {recommendedOffenders.filter(o => o.status === 'assigned').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Offense Type</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Sentence Length</TableCell>
                <TableCell>Needs</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recommendedOffenders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((offender) => (
                  <TableRow key={offender.id}>
                    <TableCell>
                      <Typography variant="body1">
                        {offender.firstName} {offender.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{offender.offenseType}</TableCell>
                    <TableCell>
                      <Chip 
                        label={offender.riskLevel}
                        color={
                          offender.riskLevel === 'High' ? 'error' :
                          offender.riskLevel === 'Medium' ? 'warning' : 'success'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{offender.sentenceLength} months</TableCell>
                    <TableCell>
                      <Box>
                        {offender.substanceAbuse && (
                          <Chip 
                            label="Substance Abuse" 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                            color="warning"
                          />
                        )}
                        {offender.mentalHealthIssues && (
                          <Chip 
                            label="Mental Health" 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                            color="info"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {offender.status === 'assigned' ? (
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Assigned" 
                          color="success" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          label="Pending" 
                          color="warning" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AssignmentIcon />}
                        onClick={() => handleAssignInstitution(offender)}
                        disabled={offender.status === 'assigned'}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={recommendedOffenders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign to Institution
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedOffender && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Offender: {selectedOffender.firstName} {selectedOffender.lastName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Institution"
                    value={assignmentData.institution}
                    onChange={(e) => setAssignmentData({...assignmentData, institution: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={assignmentData.startDate}
                    onChange={(e) => setAssignmentData({...assignmentData, startDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={assignmentData.endDate}
                    onChange={(e) => setAssignmentData({...assignmentData, endDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hours Required"
                    type="number"
                    value={assignmentData.hoursRequired}
                    onChange={(e) => setAssignmentData({...assignmentData, hoursRequired: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Supervisor Name"
                    value={assignmentData.supervisor}
                    onChange={(e) => setAssignmentData({...assignmentData, supervisor: e.target.value})}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitAssignment} 
            variant="contained"
            disabled={!assignmentData.institution || !assignmentData.startDate || !assignmentData.hoursRequired}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecommendedList;