import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Reports = () => {
  const [reportType, setReportType] = useState('completion');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState({
    completed: [],
    defaulted: [],
    demographics: [],
    trends: []
  });
  const [stats, setStats] = useState({
    completedCount: 0,
    defaultedCount: 0,
    activeCount: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      // Fetch completed assignments (#7)
      const completedQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completed = [];
      completedSnapshot.forEach((doc) => {
        completed.push({ id: doc.id, ...doc.data() });
      });

      // Fetch defaulted assignments (#8)
      const defaultedQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'defaulted')
      );
      const defaultedSnapshot = await getDocs(defaultedQuery);
      const defaulted = [];
      defaultedSnapshot.forEach((doc) => {
        defaulted.push({ id: doc.id, ...doc.data() });
      });

      // Fetch all offenders for demographics
      const offendersSnapshot = await getDocs(collection(db, 'offenders'));
      const offenders = [];
      offendersSnapshot.forEach((doc) => {
        offenders.push({ id: doc.id, ...doc.data() });
      });

      // Calculate stats
      const totalCompleted = completed.length;
      const totalDefaulted = defaulted.length;
      const totalActive = offenders.filter(o => o.status === 'active').length;
      const completionRate = totalCompleted + totalDefaulted > 0 
        ? (totalCompleted / (totalCompleted + totalDefaulted)) * 100 
        : 0;

      setStats({
        completedCount: totalCompleted,
        defaultedCount: totalDefaulted,
        activeCount: totalActive,
        completionRate: completionRate.toFixed(1)
      });

      // Prepare chart data
      const monthlyData = processMonthlyData(completed, defaulted);
      const demographicData = processDemographicData(offenders);

      setReportData({
        completed,
        defaulted,
        demographics: demographicData,
        trends: monthlyData
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const processMonthlyData = (completed, defaulted) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    months.forEach((month, index) => {
      const monthCompleted = completed.filter(c => {
        const date = new Date(c.completionDate || c.createdAt);
        return date.getMonth() === index;
      }).length;

      const monthDefaulted = defaulted.filter(d => {
        const date = new Date(d.defaultedDate || d.createdAt);
        return date.getMonth() === index;
      }).length;

      data.push({
        month,
        completed: monthCompleted,
        defaulted: monthDefaulted
      });
    });

    return data;
  };

  const processDemographicData = (offenders) => {
    const riskLevels = {
      High: offenders.filter(o => o.riskLevel === 'High').length,
      Medium: offenders.filter(o => o.riskLevel === 'Medium').length,
      Low: offenders.filter(o => o.riskLevel === 'Low').length
    };

    return [
      { name: 'High Risk', value: riskLevels.High, color: '#f44336' },
      { name: 'Medium Risk', value: riskLevels.Medium, color: '#ff9800' },
      { name: 'Low Risk', value: riskLevels.Low, color: '#4caf50' }
    ];
  };

  const handleExport = () => {
    // Export logic here
    console.log('Exporting report...');
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Reports & Analytics</Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={handleExport}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />} 
              onClick={handlePrint}
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="completion">Completion Rate (#7)</MenuItem>
                <MenuItem value="default">Default Rate (#8)</MenuItem>
                <MenuItem value="demographics">Offender Demographics</MenuItem>
                <MenuItem value="trends">Monthly Trends</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#e8f5e8' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed (#7)
                </Typography>
                <Typography variant="h4">
                  {stats.completedCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#ffebee' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Defaulted (#8)
                </Typography>
                <Typography variant="h4">
                  {stats.defaultedCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Cases
                </Typography>
                <Typography variant="h4">
                  {stats.activeCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h4">
                  {stats.completionRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {reportType === 'completion' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Completed vs Defaulted
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                    <Bar dataKey="defaulted" fill="#f44336" name="Defaulted" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {reportType === 'demographics' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Risk Level Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={reportData.demographics}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.demographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {reportType === 'trends' && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#4caf50" name="Completed" />
                    <Line type="monotone" dataKey="defaulted" stroke="#f44336" name="Defaulted" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Detailed Table */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Report
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Offender Name</TableCell>
                  <TableCell>Assignment Date</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completion Date</TableCell>
                  <TableCell>Supervisor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.completed.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.offenderName}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{item.institution}</TableCell>
                    <TableCell>
                      <Chip label="Completed" color="success" size="small" />
                    </TableCell>
                    <TableCell>{new Date(item.completionDate || item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{item.supervisor}</TableCell>
                  </TableRow>
                ))}
                {reportData.defaulted.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.offenderName}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{item.institution}</TableCell>
                    <TableCell>
                      <Chip label="Defaulted" color="error" size="small" />
                    </TableCell>
                    <TableCell>{new Date(item.defaultedDate || item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{item.supervisor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default Reports;