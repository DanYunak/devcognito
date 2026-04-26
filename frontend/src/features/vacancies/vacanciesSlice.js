import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMatchedVacancies = createAsyncThunk(
  'vacancies/fetchMatched',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/vacancies/matched');
      return data.vacancies;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch vacancies');
    }
  }
);

export const fetchPublicVacancies = createAsyncThunk(
  'vacancies/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/vacancies');
      return data.vacancies;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch vacancies');
    }
  }
);

export const createVacancy = createAsyncThunk(
  'vacancies/create',
  async (vacancyData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/vacancies', vacancyData);
      return data.vacancy;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create vacancy');
    }
  }
);

const vacanciesSlice = createSlice({
  name: 'vacancies',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearVacancyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchedVacancies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchedVacancies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMatchedVacancies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicVacancies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicVacancies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPublicVacancies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createVacancy.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });
  },
});

export const { clearVacancyError } = vacanciesSlice.actions;
export default vacanciesSlice.reducer;