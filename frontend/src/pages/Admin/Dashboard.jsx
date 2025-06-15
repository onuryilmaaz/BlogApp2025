import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import useUserStore from "../../stores/userStore";
//import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import {
  LuChartLine,
  LuCheckCheck,
  LuGalleryVerticalEnd,
  LuHeart,
  LuLoaderCircle,
  LuUsers,
  LuMessageSquare,
  LuEye,
  LuTrendingUp,
  LuTrendingDown,
  LuClock,
  LuBot,
  LuShield,
  LuCalendar,
} from "react-icons/lu";
import DashboardSummaryCard from "../../components/Cards/DashboardSummaryCard";
import TagInsights from "../../components/Cards/TagInsights";
import TopPostCard from "../../components/Cards/TopPostCard";
import RecentCommentsList from "../../components/Cards/RecentCommentsList";

const Dashboard = () => {
  const user = useUserStore((state) => state.user);
  //const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [maxViews, setMaxViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const getDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log("Fetching dashboard data...");

      const response = await axiosInstance.get(
        API_PATHS.DASHBOARD.GET_DASHBOARD_DATA
      );

      console.log("Dashboard API Response:", response.data);

      if (response.data) {
        setDashboardData(response.data);

        const topPosts = response.data?.topPosts || [];
        console.log("Top Posts:", topPosts);

        const totalViews = Math.max(...topPosts.map((p) => p.views || 0), 1);
        setMaxViews(totalViews);

        console.log("Recent Comments:", response.data?.recentComments);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    getDashboardData();
    const interval = setInterval(() => {
      getDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Loading shimmer component
  const LoadingShimmer = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  // Enhanced Stats Card Component
  const EnhancedStatsCard = ({
    icon,
    label,
    value,
    growth,
    bgColor,
    color,
    isPositive,
  }) => (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <span className={`text-xl ${color}`}>{icon}</span>
        </div>
        {growth !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {isPositive ? (
              <LuTrendingUp className="w-3 h-3" />
            ) : (
              <LuTrendingDown className="w-3 h-3" />
            )}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{label}</p>
      </div>
    </div>
  );

  // Quick Actions Widget
  const QuickActionsWidget = () => (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-sm font-medium transition-colors">
          <LuGalleryVerticalEnd className="w-4 h-4 mb-1 mx-auto" />
          New Post
        </button>
        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-sm font-medium transition-colors">
          <LuUsers className="w-4 h-4 mb-1 mx-auto" />
          Manage Users
        </button>
        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-sm font-medium transition-colors">
          <LuBot className="w-4 h-4 mb-1 mx-auto" />
          AI Review
        </button>
        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 text-sm font-medium transition-colors">
          <LuChartLine className="w-4 h-4 mb-1 mx-auto" />
          Analytics
        </button>
      </div>
    </div>
  );

  // Activity Timeline Widget
  const ActivityTimelineWidget = ({ activities = [] }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <LuClock className="w-5 h-5 text-blue-500" />
          Recent Activity
        </h3>
        <span className="text-xs text-gray-500">Live</span>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className={`p-1.5 rounded-full ${
                  activity.type === "post"
                    ? "bg-blue-100 text-blue-600"
                    : activity.type === "comment"
                    ? "bg-green-100 text-green-600"
                    : activity.type === "user"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {activity.type === "post" ? (
                  <LuGalleryVerticalEnd className="w-3 h-3" />
                ) : activity.type === "comment" ? (
                  <LuMessageSquare className="w-3 h-3" />
                ) : activity.type === "user" ? (
                  <LuUsers className="w-3 h-3" />
                ) : (
                  <LuEye className="w-3 h-3" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {moment(activity.timestamp).fromNow()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 mt-5">
          <div className="flex items-center gap-3 mb-6">
            <LuLoaderCircle className="animate-spin text-2xl text-sky-500" />
            <div>
              <LoadingShimmer className="h-7 w-48 mb-2" />
              <LoadingShimmer className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <LoadingShimmer className="h-6 w-6 rounded-full mb-2" />
                <LoadingShimmer className="h-4 w-16 mb-1" />
                <LoadingShimmer className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 md:my-6">
          <div className="col-span-12 md:col-span-7 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
            <LoadingShimmer className="h-5 w-32 mb-4" />
            <LoadingShimmer className="h-64 w-full" />
          </div>
          <div className="col-span-12 md:col-span-5 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
            <LoadingShimmer className="h-5 w-24 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="py-4 border-b border-gray-100 last:border-none"
              >
                <div className="flex items-start gap-2 mb-3">
                  <LoadingShimmer className="w-10 h-10 rounded-md" />
                  <LoadingShimmer className="h-4 w-32" />
                </div>
                <LoadingShimmer className="h-2 w-full mb-2" />
                <div className="flex justify-between">
                  <LoadingShimmer className="h-3 w-16" />
                  <LoadingShimmer className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-12 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
            <LoadingShimmer className="h-5 w-32 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 border-b border-gray-100 pb-4 mb-4 last:border-none"
              >
                <LoadingShimmer className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <LoadingShimmer className="h-4 w-24 mb-2" />
                  <LoadingShimmer className="h-3 w-full mb-2" />
                  <div className="flex items-center gap-3">
                    <LoadingShimmer className="w-9 h-9 rounded-md" />
                    <LoadingShimmer className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 mt-5">
          <div className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">
              ⚠️ Error Loading Dashboard
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => getDashboardData()}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      {dashboardData && (
        <>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 rounded-2xl text-white mt-5 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {getGreeting()}! {user?.name || "User"}
                  </h2>
                  <p className="text-blue-100 mt-2 flex items-center gap-2">
                    <LuCalendar className="w-4 h-4" />
                    {moment().format("dddd, MMMM Do YYYY")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {refreshing && (
                    <LuLoaderCircle className="animate-spin text-white/80" />
                  )}
                  <button
                    onClick={() => getDashboardData(true)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    disabled={refreshing}
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
            <EnhancedStatsCard
              icon={<LuGalleryVerticalEnd />}
              label="Total Posts"
              value={dashboardData?.stats?.totalPosts || 0}
              growth={calculateGrowth(
                dashboardData?.stats?.totalPosts,
                dashboardData?.stats?.previousTotalPosts
              )}
              bgColor="bg-blue-100"
              color="text-blue-600"
              isPositive={true}
            />

            <EnhancedStatsCard
              icon={<LuEye />}
              label="Total Views"
              value={dashboardData?.stats?.totalViews || 0}
              growth={calculateGrowth(
                dashboardData?.stats?.totalViews,
                dashboardData?.stats?.previousTotalViews
              )}
              bgColor="bg-green-100"
              color="text-green-600"
              isPositive={true}
            />

            <EnhancedStatsCard
              icon={<LuUsers />}
              label="Total Users"
              value={dashboardData?.stats?.totalUsers || 0}
              growth={calculateGrowth(
                dashboardData?.stats?.totalUsers,
                dashboardData?.stats?.previousTotalUsers
              )}
              bgColor="bg-purple-100"
              color="text-purple-600"
              isPositive={true}
            />

            <EnhancedStatsCard
              icon={<LuMessageSquare />}
              label="Total Comments"
              value={dashboardData?.stats?.totalComments || 0}
              growth={calculateGrowth(
                dashboardData?.stats?.totalComments,
                dashboardData?.stats?.previousTotalComments
              )}
              bgColor="bg-orange-100"
              color="text-orange-600"
              isPositive={true}
            />
          </div>

          {/* Content Moderation Alert */}
          {dashboardData?.stats?.pendingReview > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <LuBot className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900">
                    AI Content Review Required
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {dashboardData.stats.pendingReview} AI-generated posts are
                    waiting for your review
                  </p>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Review Now
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Tag Insights */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LuChartLine className="w-5 h-5 text-blue-500" />
                    Tag Performance Analytics
                  </h3>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                <TagInsights tagUsage={dashboardData?.tagUsage || []} />
              </div>

              {/* Recent Comments */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LuMessageSquare className="w-5 h-5 text-green-500" />
                    Recent Comments
                  </h3>
                  <span className="text-xs text-gray-500">
                    {dashboardData?.recentComments?.length || 0} total
                  </span>
                </div>
                {dashboardData?.recentComments?.length > 0 ? (
                  <RecentCommentsList
                    comments={dashboardData.recentComments || []}
                  />
                ) : (
                  <div className="text-center py-8">
                    <LuMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 text-sm">No comments yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Actions */}
              <QuickActionsWidget />

              {/* Top Posts */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LuTrendingUp className="w-5 h-5 text-purple-500" />
                    Top Performing Posts
                  </h3>
                  <span className="text-xs text-gray-500">
                    {dashboardData?.topPosts?.length || 0} posts
                  </span>
                </div>
                {dashboardData?.topPosts?.length > 0 ? (
                  dashboardData.topPosts
                    .slice(0, 3)
                    .map((post, index) => (
                      <TopPostCard
                        key={post._id || post.id || `post-${index}`}
                        title={post.title || "Untitled Post"}
                        coverImageUrl={
                          post.coverImageUrl || "/placeholder-image.jpg"
                        }
                        views={post.views || 0}
                        likes={post.likes || 0}
                        maxViews={maxViews}
                      />
                    ))
                ) : (
                  <div className="text-center py-8">
                    <LuGalleryVerticalEnd className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-gray-500 text-sm">No posts found</div>
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <ActivityTimelineWidget
                activities={
                  dashboardData?.recentActivity || [
                    {
                      type: "post",
                      description: "New blog post published",
                      timestamp: new Date(),
                    },
                    {
                      type: "comment",
                      description: "New comment received",
                      timestamp: new Date(Date.now() - 1000 * 60 * 15),
                    },
                    {
                      type: "user",
                      description: "New user registered",
                      timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    },
                  ]
                }
              />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
