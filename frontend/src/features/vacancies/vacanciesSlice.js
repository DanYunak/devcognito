import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMatchedVacancies = createAsyncThunk(
  'vacancies/fetchMatched',
  async ({ page = 1, limit = 10, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          params.set(key, value);
        }
      });

      const { data } = await api.get(`/vacancies/matched?${params.toString()}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch vacancies');
    }
  }
);

export const fetchPublicVacancies = createAsyncThunk(
  'vacancies/fetchPublic',
  async ({ page = 1, limit = 10, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          params.set(key, value);
        }
      });

      const { data } = await api.get(`/vacancies?${params.toString()}`);
      return data;
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
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasMore: false },
    filters: { search: '', skills: '', expMin: '', expMax: '', salaryMin: '', salaryMax: '' },
    loading: false,
    loadingMore: false,
    error: null,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters(state) {
      state.filters = { search: '', skills: '', expMin: '', expMax: '', salaryMin: '', salaryMax: '' };
      state.pagination.page = 1;
    },
    clearVacancyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchedVacancies.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        if (page === 1) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchMatchedVacancies.fulfilled, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        state.loading = false;
        state.loadingMore = false;
        state.list = page === 1 ? action.payload.vacancies : [...state.list, ...action.payload.vacancies];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMatchedVacancies.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicVacancies.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        if (page === 1) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchPublicVacancies.fulfilled, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        state.loading = false;
        state.loadingMore = false;
        state.list = page === 1 ? action.payload.vacancies : [...state.list, ...action.payload.vacancies];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPublicVacancies.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      .addCase(createVacancy.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });
  },
});

export const { clearVacancyError, setFilters, clearFilters } = vacanciesSlice.actions;
export default vacanciesSlice.reducer;
