import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const applyToVacancy = createAsyncThunk(
  'applications/apply',
  async ({ vacancy_id, cover_letter }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/applications', { vacancy_id, cover_letter });
      return data.application;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to apply');
    }
  }
);

export const fetchMyApplications = createAsyncThunk(
  'applications/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/applications/me');
      return data.applications;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const fetchBoard = createAsyncThunk(
  'applications/fetchBoard',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/applications/board');
      return data.board;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch board');
    }
  }
);

export const updateStatus = createAsyncThunk(
  'applications/updateStatus',
  async ({ applicationId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/applications/${applicationId}/status`, { status });
      return data.application;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    myApplications: [],
    board: { new: [], interview: [], offer: [], rejected: [] },
    loading: false,
    error: null,
  },
  reducers: {
    clearApplicationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyToVacancy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyToVacancy.fulfilled, (state, action) => {
        state.loading = false;
        state.myApplications.unshift(action.payload);
      })
      .addCase(applyToVacancy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.myApplications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.board = action.payload;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        // Remove from all columns then insert into correct one
        const columns = ['new', 'interview', 'offer', 'rejected'];
        columns.forEach((col) => {
          state.board[col] = state.board[col].filter(
            (a) => String(a._id) !== String(updated._id)
          );
        });
        if (state.board[updated.status]) {
          state.board[updated.status].unshift(updated);
        }
      });
  },
});

export const { clearApplicationError } = applicationsSlice.actions;
export default applicationsSlice.reducer;