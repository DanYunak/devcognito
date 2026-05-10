import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setFilters,
  clearFilters,
  fetchMatchedVacancies,
} from '../features/vacancies/vacanciesSlice';

const emptyFilters = {
  search: '',
  skills: '',
  expMin: '',
  expMax: '',
  salaryMin: '',
  salaryMax: '',
};

export default function VacancyFilters() {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.vacancies);
  const [form, setForm] = useState({ ...emptyFilters, ...filters });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    dispatch(setFilters(form));
    dispatch(fetchMatchedVacancies({ page: 1, limit: 10, filters: form }));
  };

  const handleClear = () => {
    setForm(emptyFilters);
    dispatch(clearFilters());
    dispatch(fetchMatchedVacancies({ page: 1, limit: 10, filters: emptyFilters }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
          <input
            name="search"
            value={form.search}
            onChange={handleChange}
            placeholder="Search by title"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Skills</label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Exp Min</label>
            <input
              name="expMin"
              type="number"
              min="0"
              value={form.expMin}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Exp Max</label>
            <input
              name="expMax"
              type="number"
              min="0"
              value={form.expMax}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Salary Min</label>
            <input
              name="salaryMin"
              type="number"
              min="0"
              value={form.salaryMin}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Salary Max</label>
            <input
              name="salaryMax"
              type="number"
              min="0"
              value={form.salaryMax}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={handleApply}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
