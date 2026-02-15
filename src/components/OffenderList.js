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
  TextField,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const OffenderList = () => {
  const [offenders, setOffenders] = useState([]);
  const [filteredOffenders, setFilteredOffenders] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffenders();
  }, []);

  useEffect(() => {
    filterOffenders();
  }, [searchTerm, filterStatus, offenders]);

  const fetchOffenders = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'offenders'));
      const offendersList = [];
      querySnapshot.forEach((doc) => {
        offendersList.push({ id: doc.id, ...doc.data() });
      });
      setOffenders(offendersList);
      setFilteredOffenders(offendersList);
    } catch (error) {
      console.error('Error fetching offenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOffenders = () => {
    let filtered = [...offenders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(offender => 
        offender.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offender.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offender.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offender.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === true);
      } else if (filterStatus === 'not-recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === false);
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(o => o.status === 'active');
      } else if (filterStatus === 'completed') {
        filtered = filtered.filter(o => o.status === 'completed');
      }
    }

    setFilteredOffenders(filtered);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRiskChipColor = (risk) => {
    switch (risk) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusChip = (offender) => {
    if (offender.recommendedForCS) {
      return <Chip label="Recommended" color="success" size="small" />;
    } else {
      return <Chip label="Not Recommended" color="default" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Offender List (#2)</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchOffenders}
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Offenders</MenuItem>
                <MenuItem value="recommended">Recommended for CS (#4)</MenuItem>
                <MenuItem value="not-recommended">Not Recommended (#3)</MenuItem>
                <MenuItem value="active">Active Cases</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Offense Type</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Vetted By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOffenders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((offender) => (
                  <TableRow key={offender.id}>
                    <TableCell>
                      {offender.firstName} {offender.lastName}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{offender.email}</Typography>
                      <Typography variant="caption">{offender.phone}</Typography>
                    </TableCell>
                    <TableCell>{offender.offenseType}</TableCell>
                    <TableCell>
                      <Chip 
                        label={offender.riskLevel} 
                        color={getRiskChipColor(offender.riskLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(offender)}</TableCell>
                    <TableCell>{offender.vettedBy || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/offender/${offender.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredOffenders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No offenders found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOffenders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default OffenderList;