import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CourtDates = ({ currentUser }) => {
  const [courtDates, setCourtDates] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  const [formData, setFormData] = useState({
    case_id: '',
    date: '',
    court_name: '',
    judge_name: '',
    hearing_type: '',
    notes: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [courtDatesResponse, casesResponse] = await Promise.all([
        axios.get(`${API}/court-dates`),
        axios.get(`${API}/cases`)
      ]);
      
      setCourtDates(courtDatesResponse.data);
      setCases(casesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDate) {
        // For editing, we'd need a PUT endpoint
        alert('Edit functionality coming soon');
      } else {
        await axios.post(`${API}/court-dates`, formData);
      }
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving court date:', error);
      alert('Error saving court date. Please try again.');
    }
  };

  const handleDelete = async (courtDateId) => {
    if (window.confirm('Are you sure you want to delete this court date?')) {
      try {
        await axios.delete(`${API}/court-dates/${courtDateId}`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting court date:', error);
        alert('Error deleting court date. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      case_id: '',
      date: '',
      court_name: '',
      judge_name: '',
      hearing_type: '',
      notes: '',
      priority: 'medium'
    });
    setEditingDate(null);
    setShowModal(false);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCaseInfo = (caseId) => {
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem ? `${caseItem.case_number} - ${caseItem.title}` : 'Unknown Case';
  };

  const filteredCourtDates = courtDates.filter(courtDate => {
    const now = new Date();
    const dateObj = new Date(courtDate.date);
    
    switch (filter) {
      case 'upcoming':
        return dateObj >= now;
      case 'past':
        return dateObj < now;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dateObj >= today && dateObj < tomorrow;
      default:
        return true;
    }
  });

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading court dates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Dates</h1>
          <p className="text-gray-600 mt-2">Manage court appearances and hearings</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <svg className="icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Schedule Date
        </button>
      </div>

      {/* Filter */}
      <div className="card p-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-select w-full sm:w-48"
        >
          <option value="upcoming">Upcoming Dates</option>
          <option value="today">Today</option>
          <option value="past">Past Dates</option>
          <option value="all">All Dates</option>
        </select>
      </div>

      {/* Court Dates List */}
      {filteredCourtDates.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="icon-xl mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 mb-4">No court dates found</p>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Schedule your first court date
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourtDates.map((courtDate) => (
            <div key={courtDate.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`priority-indicator ${getPriorityClass(courtDate.priority)} mt-2`}></div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {courtDate.hearing_type}
                      </h3>
                      <span className={`badge badge-${courtDate.priority}`}>
                        {courtDate.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          {formatDateTime(courtDate.date)}
                        </p>
                        <p>📍 {courtDate.court_name}</p>
                        {courtDate.judge_name && (
                          <p>⚖️ Judge {courtDate.judge_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Case:</p>
                        <p>{getCaseInfo(courtDate.case_id)}</p>
                        {courtDate.notes && (
                          <p className="mt-2 text-gray-600">
                            <span className="font-medium">Notes:</span> {courtDate.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleDelete(courtDate.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule Court Date
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Case *</label>
                  <select
                    value={formData.case_id}
                    onChange={(e) => setFormData({...formData, case_id: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select Case</option>
                    {cases.map(caseItem => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.case_number} - {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="form-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Hearing Type *</label>
                  <input
                    type="text"
                    value={formData.hearing_type}
                    onChange={(e) => setFormData({...formData, hearing_type: e.target.value})}
                    className="form-input"
                    placeholder="e.g., Initial Hearing, Motion Hearing, Trial"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Court Name *</label>
                    <input
                      type="text"
                      value={formData.court_name}
                      onChange={(e) => setFormData({...formData, court_name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Judge Name</label>
                    <input
                      type="text"
                      value={formData.judge_name}
                      onChange={(e) => setFormData({...formData, judge_name: e.target.value})}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-textarea"
                    rows="3"
                    placeholder="Additional notes or preparation details..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Schedule Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtDates;
