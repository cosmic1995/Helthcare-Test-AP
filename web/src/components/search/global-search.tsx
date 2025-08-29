'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { 
  Search, 
  X, 
  FolderOpen, 
  FileText, 
  TestTube, 
  Users, 
  BarChart3,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KEYBOARD_KEYS, handleArrowNavigation } from '@/lib/accessibility'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'project' | 'requirement' | 'test' | 'user' | 'report'
  url: string
  metadata?: {
    status?: string
    priority?: string
    assignee?: string
    lastModified?: string
  }
}

// Mock search results - in real app, this would come from API
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Cardiac Monitor Device - Class II',
    description: 'FDA QMSR compliance project for cardiac monitoring device with wireless connectivity',
    type: 'project',
    url: '/projects/1',
    metadata: {
      status: 'active',
      assignee: 'Sarah Johnson',
      lastModified: '2024-01-15'
    }
  },
  {
    id: '2',
    title: 'REQ-001: Device Safety Requirements',
    description: 'Critical safety requirements for medical device operation under normal and fault conditions',
    type: 'requirement',
    url: '/requirements/2',
    metadata: {
      status: 'approved',
      priority: 'critical',
      lastModified: '2024-01-14'
    }
  },
  {
    id: '3',
    title: 'TC-045: Power Supply Validation',
    description: 'Test case for validating power supply stability under various load conditions',
    type: 'test',
    url: '/tests/3',
    metadata: {
      status: 'passed',
      assignee: 'Mike Chen',
      lastModified: '2024-01-13'
    }
  },
  {
    id: '4',
    title: 'Dr. Emily Rodriguez',
    description: 'Senior QA Engineer - Regulatory Affairs Specialist',
    type: 'user',
    url: '/team/4',
    metadata: {
      status: 'active',
      lastModified: '2024-01-12'
    }
  },
  {
    id: '5',
    title: 'Q4 2023 Compliance Report',
    description: 'Quarterly compliance assessment covering all active projects and regulatory requirements',
    type: 'report',
    url: '/compliance/reports/5',
    metadata: {
      status: 'published',
      lastModified: '2024-01-10'
    }
  }
]

const typeIcons = {
  project: FolderOpen,
  requirement: FileText,
  test: TestTube,
  user: Users,
  report: BarChart3
}

const typeLabels = {
  project: 'Project',
  requirement: 'Requirement',
  test: 'Test Case',
  user: 'Team Member',
  report: 'Report'
}

interface GlobalSearchProps {
  placeholder?: string
  className?: string
}

export function GlobalSearch({ placeholder = "Search projects, requirements, tests...", className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'cardiac monitor',
    'safety requirements',
    'power supply tests'
  ])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Simulate search API call
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Filter mock results based on query
    const filteredResults = mockSearchResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    setResults(filteredResults)
    setIsLoading(false)
    setSelectedIndex(-1)
  }

  // Handle search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return

    const resultElements = resultsRef.current?.querySelectorAll('[data-search-result]') as NodeListOf<HTMLElement>
    const resultArray = Array.from(resultElements || [])

    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }

    if (event.key === KEYBOARD_KEYS.ENTER && selectedIndex >= 0) {
      const selectedResult = results[selectedIndex]
      if (selectedResult) {
        window.location.href = selectedResult.url
        setIsOpen(false)
      }
      return
    }

    const newIndex = handleArrowNavigation(event, resultArray, selectedIndex)
    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex)
    }
  }

  // Handle clicks outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecentSearches)
    
    setIsOpen(false)
    setQuery('')
  }

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
    inputRef.current?.focus()
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-controls="search-results"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-0">
            <div
              ref={resultsRef}
              id="search-results"
              role="listbox"
              aria-label="Search results"
              className="max-h-96 overflow-y-auto"
            >
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loading text="Searching..." showText />
                </div>
              ) : query && results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm">Try different keywords or check spelling</p>
                </div>
              ) : query && results.length > 0 ? (
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </div>
                  {results.map((result, index) => {
                    const Icon = typeIcons[result.type]
                    const isSelected = index === selectedIndex
                    
                    return (
                      <Link
                        key={result.id}
                        href={result.url}
                        data-search-result
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "flex items-start space-x-3 p-3 hover:bg-accent transition-colors border-b last:border-b-0",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleResultClick(result)}
                      >
                        <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm truncate">{result.title}</p>
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[result.type]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                          {result.metadata && (
                            <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                              {result.metadata.status && (
                                <Badge variant="outline" className="text-xs">
                                  {result.metadata.status}
                                </Badge>
                              )}
                              {result.metadata.priority && (
                                <Badge 
                                  variant={result.metadata.priority === 'critical' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {result.metadata.priority}
                                </Badge>
                              )}
                              {result.metadata.assignee && (
                                <span>Assigned to {result.metadata.assignee}</span>
                              )}
                              {result.metadata.lastModified && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{result.metadata.lastModified}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              ) : !query && recentSearches.length > 0 ? (
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Recent searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="flex items-center space-x-3 w-full p-3 hover:bg-accent transition-colors text-left border-b last:border-b-0"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start typing to search</p>
                  <p className="text-xs">Search across projects, requirements, tests, and more</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
