import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const token = localStorage.getItem('token');

export const register = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/auth/me', { profile: profileData });
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Profile update failed');
    }
  }
);

export const uploadResume = createAsyncThunk(
  'auth/uploadResume',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await api.post('/auth/me/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Resume upload failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: token || null,
    loading: false,
    error: null,
    initialized: false,
    resumeUploading: false,
    resumeError: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token ?? state.token;
      state.initialized = true;
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.initialized = true;
    };

    builder
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.initialized = true;
        localStorage.removeItem('token');
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadResume.pending, (state) => {
        state.resumeUploading = true;
        state.resumeError = null;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.resumeUploading = false;
        if (state.user?.profile) {
          state.user.profile.resumePath = action.payload.resumePath;
          state.user.profile.resumePublicId = action.payload.resumePublicId;
        }
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.resumeUploading = false;
        state.resumeError = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
