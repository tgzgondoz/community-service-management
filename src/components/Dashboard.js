import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVetted: 0,
    notRecommended: 0,
    recommended: 0,
    completed: 0,
    defaulted: 0,
    active: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total vetted (#2)
      const vettedSnapshot = await getDocs(collection(db, 'offenders'));
      const totalVetted = vettedSnapshot.size;

      // Not recommended (#3)
      const notRecommendedQuery = query(
        collection(db, 'offenders'),
        where('recommendedForCS', '==', false)
      );
      const notRecommendedSnapshot = await getDocs(notRecommendedQuery);

      // Recommended (#4)
      const recommendedQuery = query(
        collection(db, 'offenders'),
        where('recommendedForCS', '==', true)
      );
      const recommendedSnapshot = await getDocs(recommendedQuery);

      // Completed (#7)
      const completedQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);

      // Defaulted (#8)
      const defaultedQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'defaulted')
      );
      const defaultedSnapshot = await getDocs(defaultedQuery);

      // Active
      const activeQuery = query(
        collection(db, 'assignments'),
        where('status', '==', 'active')
      );
      const activeSnapshot = await getDocs(activeQuery);

      setStats({
        totalVetted,
        notRecommended: notRecommendedSnapshot.size,
        recommended: recommendedSnapshot.size,
        completed: completedSnapshot.size,
        defaulted: defaultedSnapshot.size,
        active: activeSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const pieData = [
    { name: 'Completed', value: stats.completed, color: '#4caf50' },
    { name: 'Active', value: stats.active, color: '#2196f3' },
    { name: 'Defaulted', value: stats.defaulted, color: '#f44336' }
  ];

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box sx={{ backgroundColor: color, borderRadius: '50%', p: 1 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Vetted (#2)"
            value={stats.totalVetted}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            color="#2196f3"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Not Recommended (#3)"
            value={stats.notRecommended}
            icon={<WarningIcon sx={{ color: 'white' }} />}
            color="#ff9800"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Recommended (#4)"
            value={stats.recommended}
            icon={<CheckCircleIcon sx={{ color: 'white' }} />}
            color="#4caf50"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Completed (#7)"
            value={stats.completed}
            icon={<AssignmentIcon sx={{ color: 'white' }} />}
            color="#9c27b0"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Defaulted (#8)"
            value={stats.defaulted}
            icon={<ErrorIcon sx={{ color: 'white' }} />}
            color="#f44336"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Cases"
            value={stats.active}
            icon={<AssignmentIcon sx={{ color: 'white' }} />}
            color="#00bcd4"
          />
        </Grid>

        {/* Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Case Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;