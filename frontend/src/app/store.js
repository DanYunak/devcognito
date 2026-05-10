import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import vacanciesReducer from '../features/vacancies/vacanciesSlice';
import applicationsReducer from '../features/applications/applicationsSlice';
import bookmarksReducer from '../features/bookmarks/bookmarksSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    vacancies: vacanciesReducer,
    applications: applicationsReducer,
    bookmarks: bookmarksReducer,
  },
});

export default store;
