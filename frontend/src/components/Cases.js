import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Cases = ({ currentUser }) => {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    case_type: 'civil',
    status: 'active',
    client_id: '',
    assigned_attorney: '',
    court_name: '',
    judge_name: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [casesResponse, clientsResponse, usersResponse] = await Promise.all([
        axios.get(`${API}/cases`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/users`)
      ]);
      
      setCases(casesResponse.data);
      setClients(clientsResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        await axios.put(`${API}/cases/${editingCase.id}`, formData);
      } else {
        await axios.post(`${API}/cases`, formData);
      }
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving case:', error);
      alert('Error saving case. Please try again.');
    }
  };

  const handleDelete = async (caseId) => {
    if (window.confirm('Are you sure you want to delete this case? This will also delete all related court dates and documents.')) {
      try {
        await axios.delete(`${API}/cases/${caseId}`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Error deleting case. Please try again.');
      }
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      case_number: caseItem.case_number,
      title: caseItem.title,
      case_type: caseItem.case_type,
      status: caseItem.status,
      client_id: caseItem.client_id,
      assigned_attorney: caseItem.assigned_attorney,
      court_name: caseItem.court_name,
      judge_name: caseItem.judge_name || '',
      description: caseItem.description || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      case_number: '',
      title: '',
      case_type: 'civil',
      status: 'active',
      client_id: '',
      assigned_attorney: '',
      court_name: '',
      judge_name: '',
      description: ''
    });
    setEditingCase(null);
    setShowModal(false);
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesFilter = filter === 'all' || 
                         caseItem.status === filter || 
                         caseItem.case_type === filter;
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getAttorneyName = (attorneyId) => {
    const attorney = users.find(u => u.id === attorneyId);
    return attorney ? attorney.name : 'Unknown Attorney';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading cases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-2">Manage your legal cases and track their progress</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <svg className="icon mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Case
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search cases by title or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select w-full sm:w-48"
          >
            <option value="all">All Cases</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="civil">Civil Cases</option>
            <option value="criminal">Criminal Cases</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="card overflow-hidden">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <svg className="icon-xl mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No cases found</p>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4"
            >
              Create your first case
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Attorney</th>
                  <th>Court</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>
                      <span className="font-medium text-gray-900">{caseItem.case_number}</span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{caseItem.title}</p>
                        {caseItem.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {caseItem.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${caseItem.case_type}`}>
                        {caseItem.case_type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${caseItem.status}`}>
                        {caseItem.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{getClientName(caseItem.client_id)}</td>
                    <td>{getAttorneyName(caseItem.assigned_attorney)}</td>
                    <td>
                      <div>
                        <p className="text-sm text-gray-900">{caseItem.court_name}</p>
                        {caseItem.judge_name && (
                          <p className="text-xs text-gray-500">Judge {caseItem.judge_name}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(caseItem)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(caseItem.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCase ? 'Edit Case' : 'Create New Case'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Case Number *</label>
                    <input
                      type="text"
                      value={formData.case_number}
                      onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Case Type *</label>
                    <select
                      value={formData.case_type}
                      onChange={(e) => setFormData({...formData, case_type: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="civil">Civil</option>
                      <option value="criminal">Criminal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Client *</label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Assigned Attorney *</label>
                    <select
                      value={formData.assigned_attorney}
                      onChange={(e) => setFormData({...formData, assigned_attorney: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Select Attorney</option>
                      {users.filter(user => user.role === 'attorney').map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
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
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                    <option value="settled">Settled</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-textarea"
                    rows="3"
                    placeholder="Case description or notes..."
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
                  {editingCase ? 'Update Case' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
