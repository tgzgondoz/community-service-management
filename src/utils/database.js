import { ref, set, get, push, update, remove } from 'firebase/database';
import { db } from '../config/firebase';

// User roles
export const getUserRole = async (uid) => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val().role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

export const setUserRole = async (uid, email, role) => {
  try {
    const userRef = ref(db, `users/${uid}`);
    await set(userRef, {
      uid,
      email,
      role,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Offenders functions
export const getOffenders = async () => {
  try {
    const offendersRef = ref(db, 'offenders');
    const snapshot = await get(offendersRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting offenders:', error);
    return [];
  }
};

export const getOffendersByRecommendation = async (recommended) => {
  try {
    const offenders = await getOffenders();
    return offenders.filter(o => o.recommendedForCS === recommended);
  } catch (error) {
    console.error('Error getting offenders by recommendation:', error);
    return [];
  }
};

export const getOffenderById = async (id) => {
  try {
    const offenderRef = ref(db, `offenders/${id}`);
    const snapshot = await get(offenderRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('Error getting offender:', error);
    return null;
  }
};

export const addOffender = async (offenderData) => {
  try {
    const offendersRef = ref(db, 'offenders');
    const newOffenderRef = push(offendersRef);
    const offenderWithId = {
      ...offenderData,
      id: newOffenderRef.key,
      createdAt: offenderData.createdAt || new Date().toISOString()
    };
    await set(newOffenderRef, offenderWithId);
    return newOffenderRef.key;
  } catch (error) {
    console.error('Error adding offender:', error);
    throw error;
  }
};

export const updateOffender = async (id, data) => {
  try {
    const offenderRef = ref(db, `offenders/${id}`);
    await update(offenderRef, data);
    return true;
  } catch (error) {
    console.error('Error updating offender:', error);
    throw error;
  }
};

export const deleteOffender = async (id) => {
  try {
    const offenderRef = ref(db, `offenders/${id}`);
    await remove(offenderRef);
    return true;
  } catch (error) {
    console.error('Error deleting offender:', error);
    throw error;
  }
};

// Assignments functions
export const getAssignments = async () => {
  try {
    const assignmentsRef = ref(db, 'assignments');
    const snapshot = await get(assignmentsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting assignments:', error);
    return [];
  }
};

export const getAssignmentsByStatus = async (status) => {
  try {
    const assignments = await getAssignments();
    return assignments.filter(a => a.status === status);
  } catch (error) {
    console.error('Error getting assignments by status:', error);
    return [];
  }
};

export const addAssignment = async (assignmentData) => {
  try {
    const assignmentsRef = ref(db, 'assignments');
    const newAssignmentRef = push(assignmentsRef);
    const assignmentWithId = {
      ...assignmentData,
      id: newAssignmentRef.key,
      createdAt: assignmentData.createdAt || new Date().toISOString()
    };
    await set(newAssignmentRef, assignmentWithId);
    return newAssignmentRef.key;
  } catch (error) {
    console.error('Error adding assignment:', error);
    throw error;
  }
};

export const updateAssignment = async (id, data) => {
  try {
    const assignmentRef = ref(db, `assignments/${id}`);
    await update(assignmentRef, data);
    return true;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};

// Interventions functions
export const getInterventions = async () => {
  try {
    const interventionsRef = ref(db, 'interventions');
    const snapshot = await get(interventionsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting interventions:', error);
    return [];
  }
};

export const addIntervention = async (interventionData) => {
  try {
    const interventionsRef = ref(db, 'interventions');
    const newInterventionRef = push(interventionsRef);
    const interventionWithId = {
      ...interventionData,
      id: newInterventionRef.key,
      createdAt: interventionData.createdAt || new Date().toISOString()
    };
    await set(newInterventionRef, interventionWithId);
    return newInterventionRef.key;
  } catch (error) {
    console.error('Error adding intervention:', error);
    throw error;
  }
};

export const updateIntervention = async (id, data) => {
  try {
    const interventionRef = ref(db, `interventions/${id}`);
    await update(interventionRef, data);
    return true;
  } catch (error) {
    console.error('Error updating intervention:', error);
    throw error;
  }
};

// Activities functions
export const getActivities = async () => {
  try {
    const activitiesRef = ref(db, 'activities');
    const snapshot = await get(activitiesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

export const addActivity = async (activityData) => {
  try {
    const activitiesRef = ref(db, 'activities');
    const newActivityRef = push(activitiesRef);
    const activityWithId = {
      ...activityData,
      id: newActivityRef.key,
      timestamp: activityData.timestamp || new Date().toISOString()
    };
    await set(newActivityRef, activityWithId);
    return newActivityRef.key;
  } catch (error) {
    console.error('Error adding activity:', error);
    throw error;
  }
};

// Stats functions
export const getStats = async () => {
  try {
    const [offenders, assignments] = await Promise.all([
      getOffenders(),
      getAssignments()
    ]);

    return {
      totalVetted: offenders.length,
      notRecommended: offenders.filter(o => !o.recommendedForCS).length,
      recommended: offenders.filter(o => o.recommendedForCS).length,
      completed: assignments.filter(a => a.status === 'completed').length,
      defaulted: assignments.filter(a => a.status === 'defaulted').length,
      active: assignments.filter(a => a.status === 'active' || a.status === 'new').length
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalVetted: 0,
      notRecommended: 0,
      recommended: 0,
      completed: 0,
      defaulted: 0,
      active: 0
    };
  }
};

// User profile functions
export const getUserProfile = async (uid) => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { uid, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Create a database object with all functions
const database = {
  getUserRole,
  setUserRole,
  getAllUsers,
  getOffenders,
  getOffendersByRecommendation,
  getOffenderById,
  addOffender,
  updateOffender,
  deleteOffender,
  getAssignments,
  getAssignmentsByStatus,
  addAssignment,
  updateAssignment,
  getInterventions,
  addIntervention,
  updateIntervention,
  getActivities,
  addActivity,
  getStats,
  getUserProfile,
  updateUserProfile
};

export default database;