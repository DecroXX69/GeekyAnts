// File: src/components/TagInput.jsx
import React, { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

/**
 * TagInput: Reusable component for managing tags/skills input
 * Used in ProfilePage and potentially ProjectFormPage for skills management
 * Supports adding tags, removing tags, and suggestions
 */
const TagInput = ({ 
  tags = [], 
  onTagsChange, 
  suggestions = [], 
  placeholder = "Add tag...",
  maxTags = null,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  // Filter suggestions based on input and existing tags
  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.includes(suggestion)
  ).slice(0, 8) // Limit to 8 suggestions

  // Add a new tag
  const addTag = (tag) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (maxTags && tags.length >= maxTags) {
        return // Don't add if max tags reached
      }
      onTagsChange([...tags, trimmedTag])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  // Remove a tag
  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }

  // Handle input key events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0)
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Display existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={maxTags && tags.length >= maxTags ? `Maximum ${maxTags} tags reached` : placeholder}
          disabled={maxTags && tags.length >= maxTags}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md transition-colors"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          Press Enter to add{filteredSuggestions.length > 0 ? ', or click suggestions below' : ''}
        </span>
        {maxTags && (
          <span>{tags.length}/{maxTags} tags</span>
        )}
      </div>
    </div>
  )
}

export default TagInput