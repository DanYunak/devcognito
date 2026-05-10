import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBookmarks = createAsyncThunk(
  'bookmarks/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bookmarks');
      return data.bookmarks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookmarks');
    }
  }
);

export const addBookmark = createAsyncThunk(
  'bookmarks/add',
  async (vacancyId, { rejectWithValue }) => {
    try {
      await api.post('/bookmarks', { vacancy_id: vacancyId });
      return vacancyId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add bookmark');
    }
  }
);

export const removeBookmark = createAsyncThunk(
  'bookmarks/remove',
  async (vacancyId, { rejectWithValue }) => {
    try {
      await api.delete(`/bookmarks/${vacancyId}`);
      return vacancyId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove bookmark');
    }
  }
);

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => String(item._id) !== String(action.payload));
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => String(item._id) !== String(action.payload));
      });
  },
});

export default bookmarksSlice.reducer;
