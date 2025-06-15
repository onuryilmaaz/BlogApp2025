import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Hash, Check } from "lucide-react";
import { useTagSuggestions } from "../../hooks/useTags";
import { useDebounce } from "../../hooks/useDebounce";

const TagInput = ({
  tags = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  allowCustomTags = true,
  suggestionsEnabled = true,
  className = "",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce input for suggestions
  const debouncedInput = useDebounce(inputValue, 300);

  // Get tag suggestions
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useTagSuggestions(
      debouncedInput,
      suggestionsEnabled && debouncedInput.length >= 2
    );

  const suggestions = suggestionsData?.suggestions || [];

  // Filter out already selected tags
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !tags.some((tag) =>
        typeof tag === "string"
          ? tag.toLowerCase() === suggestion.name.toLowerCase()
          : tag.name?.toLowerCase() === suggestion.name.toLowerCase()
      )
  );

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          addTag(filteredSuggestions[selectedIndex]);
        } else if (inputValue.trim() && allowCustomTags) {
          addCustomTag(inputValue.trim());
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case "Backspace":
        if (!inputValue && tags.length > 0) {
          removeTag(tags.length - 1);
        }
        break;

      case ",":
      case ";":
        e.preventDefault();
        if (inputValue.trim() && allowCustomTags) {
          addCustomTag(inputValue.trim());
        }
        break;
    }
  };

  // Add tag from suggestions
  const addTag = (suggestion) => {
    if (tags.length >= maxTags) return;

    const newTag = {
      name: suggestion.name,
      displayName: suggestion.displayName,
      color: suggestion.color,
      postCount: suggestion.postCount,
    };

    onChange([...tags, newTag]);
    setInputValue("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Add custom tag
  const addCustomTag = (tagName) => {
    if (tags.length >= maxTags) return;

    const normalizedName = tagName.toLowerCase().replace(/\s+/g, "-");

    // Check if tag already exists
    const exists = tags.some((tag) =>
      typeof tag === "string"
        ? tag.toLowerCase() === normalizedName
        : tag.name?.toLowerCase() === normalizedName
    );

    if (exists) return;

    const newTag =
      typeof tags[0] === "string"
        ? normalizedName
        : {
            name: normalizedName,
            displayName: tagName,
            color: "#3B82F6",
            isCustom: true,
          };

    onChange([...tags, newTag]);
    setInputValue("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Remove tag
  const removeTag = (index) => {
    if (disabled) return;
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      setIsOpen(true);
    }
  };

  // Get tag display info
  const getTagDisplay = (tag) => {
    if (typeof tag === "string") {
      return {
        name: tag,
        displayName: tag.charAt(0).toUpperCase() + tag.slice(1),
        color: "#3B82F6",
      };
    }
    return {
      name: tag.name,
      displayName: tag.displayName || tag.name,
      color: tag.color || "#3B82F6",
    };
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Tags Container */}
      <div
        className={`
        flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
        ${disabled ? "bg-gray-50 cursor-not-allowed" : "cursor-text"}
        ${tags.length >= maxTags ? "border-amber-300 bg-amber-50" : ""}
      `}
      >
        {/* Existing Tags */}
        {tags.map((tag, index) => {
          const tagDisplay = getTagDisplay(tag);
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md text-white font-medium"
              style={{ backgroundColor: tagDisplay.color }}
            >
              <Hash size={12} />
              {tagDisplay.displayName}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tagDisplay.displayName} tag`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}

        {/* Input Field */}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={tags.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder-gray-400 disabled:cursor-not-allowed"
          />
        )}
      </div>

      {/* Tag Limit Warning */}
      {tags.length >= maxTags && (
        <p className="text-xs text-amber-600 mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestionsLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Loading suggestions...
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between
                    ${
                      index === selectedIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <span className="font-medium">
                      {suggestion.displayName}
                    </span>
                    {suggestion.postCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {suggestion.postCount} posts
                      </span>
                    )}
                  </div>
                  {index === selectedIndex && <Check size={16} />}
                </button>
              ))}

              {/* Add custom tag option */}
              {allowCustomTags && inputValue.trim() && (
                <button
                  type="button"
                  onClick={() => addCustomTag(inputValue.trim())}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100
                    ${
                      selectedIndex === filteredSuggestions.length
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }
                  `}
                >
                  <Plus size={16} />
                  <span>Create "{inputValue.trim()}"</span>
                </button>
              )}
            </>
          ) : allowCustomTags && inputValue.trim() ? (
            <button
              type="button"
              onClick={() => addCustomTag(inputValue.trim())}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <Plus size={16} />
              <span>Create "{inputValue.trim()}"</span>
            </button>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput;
