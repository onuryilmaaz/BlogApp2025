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

  const getDashboardData = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    getDashboardData();
    return () => {};
  }, []);

  // Loading shimmer component
  const LoadingShimmer = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
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
              onClick={getDashboardData}
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
          <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 mt-5">
            <div>
              <div className="col-span-3">
                <h2 className="text-xl md:text-2xl font-medium">
                  Good Morning! {user?.name || "User"}
                </h2>
                <p className="text-xs md:text-[13px] font-medium text-gray-400 mt-1.5">
                  {moment().format("dddd MMM YYYY")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
              <DashboardSummaryCard
                icon={<LuGalleryVerticalEnd />}
                label="Total Post"
                value={dashboardData?.stats?.totalPosts || 0}
                bgColor="bg-sky-100/60"
                color="text-sky-500"
              />

              <DashboardSummaryCard
                icon={<LuCheckCheck />}
                label="Published"
                value={dashboardData?.stats?.published || 0}
                bgColor="bg-sky-100/60"
                color="text-sky-500"
              />

              <DashboardSummaryCard
                icon={<LuChartLine />}
                label="Total Views"
                value={dashboardData?.stats?.totalViews || 0}
                bgColor="bg-sky-100/60"
                color="text-sky-500"
              />

              <DashboardSummaryCard
                icon={<LuHeart />}
                label="Total Likes"
                value={dashboardData?.stats?.totalLikes || 0}
                bgColor="bg-sky-100/60"
                color="text-sky-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 md:my-6">
            <div className="col-span-12 md:col-span-7 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 ">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Tag Insights</h5>
              </div>
              <TagInsights tagUsage={dashboardData?.tagUsage || []} />
            </div>
            <div className="col-span-12 md:col-span-5 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium">Top Posts</h5>
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
                  <div className="text-gray-400 text-sm">No posts found</div>
                </div>
              )}
            </div>
            <div className="col-span-12 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium">Recent Comments</h5>
                <span className="text-xs text-gray-500">
                  {dashboardData?.recentComments?.length || 0} comments
                </span>
              </div>
              {dashboardData?.recentComments?.length > 0 ? (
                <RecentCommentsList
                  comments={dashboardData.recentComments || []}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">No comments found</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
