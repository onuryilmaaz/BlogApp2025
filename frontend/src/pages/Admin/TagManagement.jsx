import React, { useState, useMemo } from "react";
import {
  Hash,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Merge,
  TrendingUp,
  Eye,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Upload,
} from "lucide-react";
import {
  useTags,
  useTagStats,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  useBulkTagOperations,
} from "../../hooks/useTags";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const TagManagement = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    sort: "popular",
    page: 1,
    limit: 20,
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  // Fetch data
  const {
    data: tagsData,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTags(filters);
  const { data: statsData, isLoading: statsLoading } = useTagStats();

  // Mutations
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const mergeTagsMutation = useMergeTags();
  const { bulkDelete, bulkUpdate } = useBulkTagOperations();

  const tags = tagsData?.tags || [];
  const pagination = tagsData?.pagination || {};
  const stats = statsData || {};

  // Filter options
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "Technology", label: "Technology" },
    { value: "Lifestyle", label: "Lifestyle" },
    { value: "Business", label: "Business" },
    { value: "Education", label: "Education" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Health", label: "Health" },
    { value: "Travel", label: "Travel" },
    { value: "Food", label: "Food" },
    { value: "Sports", label: "Sports" },
    { value: "Other", label: "Other" },
  ];

  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "trending", label: "Trending" },
    { value: "alphabetical", label: "Alphabetical" },
    { value: "newest", label: "Newest" },
    { value: "recent", label: "Recently Used" },
  ];

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value, // Reset page when other filters change
    }));
  };

  // Handle tag selection
  const handleTagSelect = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTags.length === tags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(tags.map((tag) => tag._id));
    }
  };

  // Handle CRUD operations
  const handleCreateTag = async (tagData) => {
    try {
      await createTagMutation.mutateAsync(tagData);
      setShowCreateModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setShowEditModal(true);
  };

  const handleUpdateTag = async (updateData) => {
    try {
      await updateTagMutation.mutateAsync({
        tagId: editingTag._id,
        updateData,
      });
      setShowEditModal(false);
      setEditingTag(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      try {
        await deleteTagMutation.mutateAsync(tagId);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTags.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTags.length} tags?`
      )
    ) {
      try {
        await bulkDelete.mutateAsync(selectedTags);
        setSelectedTags([]);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleMergeTags = async (mergeData) => {
    try {
      await mergeTagsMutation.mutateAsync(mergeData);
      setShowMergeModal(false);
      setSelectedTags([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Statistics cards
  const StatCard = ({ icon: Icon, title, value, change, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (tagsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tagsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading tags: {tagsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-600">Manage and organize your blog tags</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Tag
          </button>
        </div>
      </div>

      {/* Statistics */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Hash}
            title="Total Tags"
            value={stats.totalTags || 0}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            title="Trending Tags"
            value={stats.trendingTags?.length || 0}
            color="green"
          />
          <StatCard
            icon={BarChart3}
            title="Most Used"
            value={stats.mostUsedTags?.[0]?.postCount || 0}
            color="purple"
          />
          <StatCard
            icon={Calendar}
            title="Recent Activity"
            value={stats.recentActivity?.length || 0}
            color="orange"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search tags..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTags.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMergeModal(true)}
                disabled={selectedTags.length < 2}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Merge size={16} />
                Merge
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedTags.length === tags.length && tags.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag._id)}
                      onChange={() => handleTagSelect(tag._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {tag.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{tag.name}</div>
                      </div>
                      {tag.metadata?.trending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <TrendingUp size={12} className="mr-1" />
                          Trending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tag.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {tag.postCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tag.lastUsed
                      ? format(new Date(tag.lastUsed), "MMM d, yyyy")
                      : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tag.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tag.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit tag"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete tag"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * filters.limit,
                pagination.totalTags
              )}{" "}
              of {pagination.totalTags} tags
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleFilterChange("page", pagination.currentPage - 1)
                }
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  handleFilterChange("page", pagination.currentPage + 1)
                }
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals would go here - CreateTagModal, EditTagModal, MergeTagsModal */}
      {/* For brevity, I'm not including the full modal implementations */}
    </div>
  );
};

export default TagManagement;
