import React from "react";
import useQuickActions from "../../hooks/useQuickActions.jsx";

const QuickActionsWidget = ({
  dashboardData = null,
  layout = "grid", // grid, list, compact
  maxActions = 6,
  showHeader = true,
  className = "",
  variant = "gradient", // gradient, solid, outline
}) => {
  const { getTopActions, executeAction, getActionsByCategory } =
    useQuickActions(dashboardData);

  const getVariantClasses = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-r from-sky-500 to-cyan-400 text-white";
      case "solid":
        return "bg-white border border-gray-200 text-gray-900";
      case "outline":
        return "border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700";
      default:
        return "bg-gradient-to-r from-sky-500 to-cyan-400 text-white";
    }
  };

  const getButtonClasses = () => {
    switch (variant) {
      case "gradient":
        return "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white";
      case "solid":
        return "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700";
      case "outline":
        return "bg-white hover:bg-gray-50 border border-gray-300 text-gray-600";
      default:
        return "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white";
    }
  };

  const topActions = getTopActions(maxActions);

  if (layout === "compact") {
    return (
      <div className={`p-4 rounded-lg ${getVariantClasses()} ${className}`}>
        {showHeader && (
          <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        )}
        <div className="flex flex-wrap gap-2">
          {topActions.map((action) => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              className={`relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${getButtonClasses()}`}
              title={action.description}
            >
              <div className="flex items-center gap-2">
                {action.icon}
                <span>{action.title}</span>
                {action.badge > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {action.badge > 9 ? "9+" : action.badge}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className={`p-6 rounded-xl ${getVariantClasses()} ${className}`}>
        {showHeader && (
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        )}
        <div className="space-y-2">
          {topActions.map((action) => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              className={`relative w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 group ${getButtonClasses()}`}
              title={action.description}
            >
              <div className="group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-75">{action.description}</div>
              </div>
              {action.badge > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {action.badge > 99 ? "99+" : action.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default grid layout
  return (
    <div className={`p-6 rounded-xl ${getVariantClasses()} ${className}`}>
      {showHeader && (
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      )}
      <div className="grid grid-cols-2 gap-3">
        {topActions.map((action) => (
          <button
            key={action.id}
            onClick={() => executeAction(action)}
            className={`relative rounded-lg p-3 text-sm font-medium transition-all duration-200 hover:scale-105 group ${getButtonClasses()}`}
            title={action.description}
          >
            <div className="flex flex-col items-center">
              <div className="mb-1 group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <span className="text-center leading-tight">{action.title}</span>
              {action.badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {action.badge > 99 ? "99+" : action.badge}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Show more actions if available */}
      {topActions.length >= maxActions && (
        <button
          onClick={() => {
            // Could implement a modal or expand functionality
            console.log("Show more actions");
          }}
          className={`w-full mt-3 rounded-lg p-2 text-xs font-medium transition-colors ${
            variant === "gradient"
              ? "bg-white/10 hover:bg-white/20"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          View More Actions
        </button>
      )}
    </div>
  );
};

export default QuickActionsWidget;
