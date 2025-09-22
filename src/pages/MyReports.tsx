import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db, Report } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { ReportCard } from '../components/ReportCard';

export function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for user's reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Report;
      });
      
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredReports = reports.filter((report) => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReportClick = (report: Report) => {
    navigate(`/report/${report.id}`);
  };

  const handleCreateReport = () => {
    navigate('/create-report');
  };

  // Calculate stats
  const stats = {
    total: reports.length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    inProgress: reports.filter(r => r.status === 'assigned' || r.status === 'verified').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>

            {/* Search Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>

            {/* Reports Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Track and manage your civic issue submissions
                </p>
              </div>
              <button
                onClick={handleCreateReport}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-gray-500">All time</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-gray-500">Awaiting verification</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-gray-500">Being addressed</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs text-green-600">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% completion rate
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your reports by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-[160px] transition-colors"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="assigned">Assigned</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filter !== 'all' || searchQuery) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {filter}
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reports List or Empty State */}
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => handleReportClick(report)}
              />
            ))}
          </div>
        ) : (
          /* Enhanced Empty State */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-center py-16 px-6">
              {reports.length === 0 ? (
                /* No reports at all */
                <>
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No reports yet
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Start making a difference in your community by reporting civic issues. 
                    Your voice matters and helps improve local infrastructure and services.
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={handleCreateReport}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Report
                    </button>
                    <div className="text-sm text-gray-500">
                      <p>Examples of issues you can report:</p>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">Road Damage</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">Street Lighting</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">Waste Management</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">Public Safety</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* No results found for current filters */
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    No reports found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No reports match your current search criteria. Try adjusting your filters or search terms.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setFilter('all');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show All Reports
                    </button>
                    <div className="text-sm text-gray-500">
                      You have {reports.length} total report{reports.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}