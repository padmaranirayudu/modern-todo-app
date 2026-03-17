"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Trash, Edit, Check, X, Sun, Moon, Calendar, Flag, AlertCircle, CheckCircle, Clock, Download, Upload, Filter, Smartphone, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isPast, isThisWeek } from 'date-fns'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
  order: number
}

interface Category {
  id: string
  name: string
  color: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const defaultCategories: Category[] = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', color: 'bg-purple-500' },
  { id: 'shopping', name: 'Shopping', color: 'bg-green-500' },
  { id: 'health', name: 'Health', color: 'bg-red-500' },
  { id: 'other', name: 'Other', color: 'bg-gray-500' }
]

export default function ModernTodoApp() {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
    }
  }, [])

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
 
  // All state variables
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [darkMode, setDarkMode] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('order')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [showShareInfo, setShowShareInfo] = useState(false)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: ''
  })
  

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  // Generate unique device ID
  useEffect(() => {
    let id = localStorage.getItem('deviceId')
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', id)
    }
    setDeviceId(id)
  }, [])

  // Load data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks')
    const savedCategories = localStorage.getItem('categories')
    const savedDarkMode = localStorage.getItem('darkMode')

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const addTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: `${deviceId}-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      dueDate: newTask.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length
    }

    setTasks([...tasks, task])
    setNewTask({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      dueDate: ''
    })
    setIsAddingTask(false)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } : task
    ))
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    ))
    setEditingTaskId(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-green-500 border-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-500 border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || 'bg-gray-500'
  }

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    if (isThisWeek(date)) return 'thisWeek'
    return 'upcoming'
  }

  const getDueDateColor = (status: string | null) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'today': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
      case 'thisWeek': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800'
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory)
    }

    if (selectedFilter === 'today') {
      filtered = filtered.filter(task => task.dueDate && isToday(new Date(task.dueDate)))
    } else if (selectedFilter === 'thisWeek') {
      filtered = filtered.filter(task => task.dueDate && isThisWeek(new Date(task.dueDate)))
    } else if (selectedFilter === 'overdue') {
      filtered = filtered.filter(task => task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed)
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(task => task.completed)
    } else if (selectedFilter === 'active') {
      filtered = filtered.filter(task => !task.completed)
    }

    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    } else if (sortBy === 'dueDate') {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    } else if (sortBy === 'order') {
      filtered.sort((a, b) => a.order - b.order)
    }

    return filtered
  }

  const calculateProgress = () => {
    if (tasks.length === 0) return 0
    const completed = tasks.filter(task => task.completed).length
    return Math.round((completed / tasks.length) * 100)
  }

  const getCategoryProgress = (categoryId: string) => {
    const categoryTasks = tasks.filter(task => task.category === categoryId)
    if (categoryTasks.length === 0) return 0
    const completed = categoryTasks.filter(task => task.completed).length
    return Math.round((completed / categoryTasks.length) * 100)
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()
    if (!draggedTask || draggedTask === targetTaskId) return

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask)
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId)

    const newTasks = [...tasks]
    const [removed] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, removed)

    newTasks.forEach((task, index) => {
      task.order = index
      task.updatedAt = new Date().toISOString()
    })

    setTasks(newTasks)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify({ 
      tasks, 
      categories, 
      exportDate: new Date().toISOString(),
      deviceId 
    }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `todo-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    link.click()
  }

  const importTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.tasks) {
          // Merge imported tasks with existing tasks
          const existingTaskIds = new Set(tasks.map(t => t.id))
          const newTasks = data.tasks.filter((t: Task) => !existingTaskIds.has(t.id))
          const mergedTasks = [...tasks, ...newTasks]
          setTasks(mergedTasks)
        }
        if (data.categories) {
          const existingCategoryIds = new Set(categories.map(c => c.id))
          const newCategories = data.categories.filter((c: Category) => !existingCategoryIds.has(c.id))
          const mergedCategories = [...categories, ...newCategories]
          setCategories(mergedCategories)
        }
        alert('Data imported successfully!')
      } catch (error) {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  const shareViaFile = async () => {
    const dataStr = JSON.stringify({ 
      tasks, 
      categories, 
      exportDate: new Date().toISOString(),
      deviceId 
    }, null, 2)
    
    if (navigator.share) {
      try {
        const blob = new Blob([dataStr], { type: 'application/json' })
        const file = new File([blob], `todo-${format(new Date(), 'yyyy-MM-dd')}.json`, { type: 'application/json' })
        
        await navigator.share({
          title: 'Todo App Data',
          text: 'Share todo list with family',
          files: [file]
        })
      } catch (error) {
        console.log('Share failed:', error)
        exportTasks()
      }
    } else {
      exportTasks()
    }
  }

  const filteredTasks = getFilteredTasks()
  const progress = calculateProgress()
  const completedCount = tasks.filter(t => t.completed).length
  const activeCount = tasks.filter(t => !t.completed).length
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.completed).length

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Install Prompt Banner */}
      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 shadow-lg"
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Install Modern Todo App</p>
                  <p className="text-sm text-blue-100">Add to your home screen for the best experience!</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`max-w-6xl mx-auto p-4 md:p-8 ${showInstallPrompt && !isInstalled ? 'pt-24' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Modern Todo
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isInstalled ? '📱 Installed App - 100% Offline' : 'Organize your tasks efficiently'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isInstalled && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Install App"
              >
                <Smartphone className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowShareInfo(!showShareInfo)}
              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
              title="Share Data"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => document.getElementById('import-file')?.click()}
              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
              title="Import Data"
            >
              <Upload className="h-5 w-5" />
            </button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importTasks}
              className="hidden"
            />
            <button
              onClick={shareViaFile}
              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
              title="Export/Share Data"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showShareInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-lg shadow-sm mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📤 Share Data with Family
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                  <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    How to Share:
                  </h4>
                  <ol className={`space-y-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    <li>1. Click the <Download className="inline h-4 w-4" /> Export button</li>
                    <li>2. Share the JSON file via:</li>
                    <ul className="ml-6 space-y-1">
                      <li>• WhatsApp</li>
                      <li>• Bluetooth</li>
                      <li>• Email</li>
                      <li>• AirDrop (iPhone)</li>
                      <li>• Any file sharing method</li>
                    </ul>
                    <li>3. Other person clicks <Upload className="inline h-4 w-4" /> Import</li>
                    <li>4. Select the received file</li>
                    <li>5. Done! Data is merged</li>
                  </ol>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                  <h4 className={`font-semibold mb-2 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
                    ✅ Benefits:
                  </h4>
                  <ul className={`space-y-1 text-sm ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                    <li>• No server needed</li>
                    <li>• No WiFi required</li>
                    <li>• No internet needed</li>
                    <li>• Share anytime, anywhere</li>
                    <li>• Complete privacy</li>
                    <li>• Works offline</li>
                  </ul>
                </div>

                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Your Device ID:</strong> {deviceId}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Each device has a unique ID to prevent conflicts
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className={`rounded-lg shadow-sm mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Overall Progress
                    </span>
                    <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tasks.length}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Tasks
                  </div>
                </div>
                <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <div className="text-2xl font-bold text-green-600">
                    {completedCount}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Completed
                  </div>
                </div>
                <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <div className="text-2xl font-bold text-red-600">
                    {overdueCount}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Overdue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Task
          </button>
        </div>

        <AnimatePresence>
          {isAddingTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className={`rounded-lg shadow-sm mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="p-6">
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create New Task
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Enter task title..."
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Add details..."
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Category
                        </label>
                        <select
                          value={newTask.category}
                          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Priority
                        </label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'high' | 'medium' | 'low' })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addTask}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Add Task
                      </button>
                      <button
                        onClick={() => setIsAddingTask(false)}
                        className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            All ({tasks.length})
          </button>
          {categories.map(cat => {
            const count = tasks.filter(t => t.category === cat.id).length
            const catProgress = getCategoryProgress(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? `${cat.color} text-white`
                    : darkMode
                    ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {cat.name} ({count}) {count > 0 && `- ${catProgress}%`}
              </button>
            )
          })}
        </div>

        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <Filter className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'active'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setSelectedFilter('completed')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('today')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'today'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedFilter('thisWeek')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'thisWeek'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedFilter('overdue')}
            className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
              selectedFilter === 'overdue'
                ? 'bg-red-600 text-white'
                : darkMode
                ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-1 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="order">Manual Order</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="py-12 text-center">
                  <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tasks found. Add a new task to get started!
                  </p>
                </div>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  draggable={sortBy === 'order'}
                  onDragStart={() => handleDragStart(task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move ${draggedTask === task.id ? 'opacity-50' : ''}`}
                >
                  <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} ${task.completed ? 'opacity-60' : ''} border-l-4 ${getPriorityColor(task.priority).split(' ')[1]}`}>
                    <div className="p-4">
                      {editingTaskId === task.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                          <textarea
                            value={task.description}
                            onChange={(e) => updateTask(task.id, { description: e.target.value })}
                            rows={2}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleComplete(task.id)}
                            className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              task.completed
                                ? 'bg-green-500 border-green-500'
                                : darkMode
                                ? 'border-gray-600 hover:border-green-500'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {task.completed && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`font-semibold ${task.completed ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setEditingTaskId(task.id)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100'}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {task.description && (
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)} text-white`}>
                                {categories.find(c => c.id === task.category)?.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                <Flag className="h-3 w-3" />
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                              {task.dueDate && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDueDateColor(getDueDateStatus(task.dueDate))}`}>
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                  {getDueDateStatus(task.dueDate) === 'overdue' && !task.completed && (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.createdAt), 'MMM dd')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {tasks.length > 0 && completedCount === tasks.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center"
          >
            <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700' : 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200'}`}>
              <div className="py-8">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Congratulations!
                </h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  You have completed all your tasks. Great job!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// END OF FILE