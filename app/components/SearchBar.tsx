'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function SearchBar({ className = '', mobile = false }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const inputRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      if (mobile) {
        // Fechar versão mobile depois do envio
        document.activeElement.blur()
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <form 
      onSubmit={handleSearch} 
      className={`relative flex items-center ${className}`}
      ref={inputRef}
    >
      <div className={`relative w-full transition-all duration-300 ${
        mobile ? 'bg-dark-200 rounded-lg' : 
        isFocused ? 'bg-dark-300 rounded-lg' : 'bg-dark-400/30 rounded-lg'
      }`}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Pesquisar..."
          className={`w-full pr-10 text-white bg-transparent outline-none ${
            mobile ? 'py-2.5 pl-3 text-base' : 'py-2 pl-3 text-sm'
          }`}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            WebkitSearchDecoration: 'none'
          }}
        />
        
        <AnimatePresence>
          {query && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-8 flex items-center text-gray-400 hover:text-white"
            >
              <FiX />
            </motion.button>
          )}
        </AnimatePresence>
        
        <button 
          type="submit" 
          className={`absolute inset-y-0 right-0 flex items-center pr-2.5 ${
            isFocused ? 'text-primary' : 'text-gray-400'
          } hover:text-primary transition-colors`}
          aria-label="Pesquisar"
        >
          <FiSearch className={mobile ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </div>
    </form>
  )
} 