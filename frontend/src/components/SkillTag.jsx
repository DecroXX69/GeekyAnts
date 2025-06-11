// src/components/SkillTag.jsx
import React from 'react'

/**
 * SkillTag: Displays a skill as a styled pill/badge
 * @param {string} skill - Skill name to display
 * @param {string} variant - Color variant ('default', 'missing', 'matched')
 * @param {string} className - Additional CSS classes
 */
const SkillTag = ({ skill, variant = 'default', className = '' }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'matched':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <span 
      className={`inline-block text-sm px-3 py-1 mr-2 mb-2 rounded-full border ${getVariantClasses()} ${className}`}
      title={skill}
    >
      {skill}
    </span>
  )
}

export default SkillTag