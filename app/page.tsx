"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, Edit, Check, X, Sun, Moon, Calendar, Flag, AlertCircle, CheckCircle, Clock, Download, Upload, Filter } from 'lucide-react'
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
  order: number
}

interface Category {
  id: string
  name: string
  color: string
}

const defaultCategories: Category[] = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', color: 'bg-purple-500' },
  { id: 'shopping', name: 'Shopping', color: 'bg-green-500' },
  { id: 'health', name: 'Health', color: 'bg-red-500' },
  { id: 'other', name: 'Other', color: 'bg-gray-500' }
]

export default function ModernTodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [darkMode, setDarkMode] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('order')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: ''
  })

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
    }
  }, [])

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
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      dueDate: newTask.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
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
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ))
    setEditingTaskId(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500'
      case 'medium': return 'text-yellow-500 border-yellow-500'
      case 'low': return 'text-green-500 border-green-500'
      default: return 'text-gray-500 border-gray-500'
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
    })

    setTasks(newTasks)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify({ tasks, categories }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `todo-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
  }

  const importTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.tasks) setTasks(data.tasks)
        if (data.categories) setCategories(data.categories)
      } catch (error) {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  const filteredTasks = getFilteredTasks()
  const progress = calculateProgress()
  const completedCount = tasks.filter(t => t.completed).length
  const activeCount = tasks.filter(t => !t.completed).length
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !t.completed).length

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Modern Todo
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Organize your tasks efficiently
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('import-file')?.click()}
              className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importTasks}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={exportTasks}
              className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Card className={`mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        <div className="mb-6">
          <Button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </Button>
        </div>

        <AnimatePresence>
          {isAddingTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className={`mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>
                    Create New Task
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Task Title
                    </Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title..."
                      className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Add details..."
                      className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Category
                      </Label>
                      <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                        <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className={darkMode ? 'text-white' : ''}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Priority
                      </Label>
                      <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                        <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                          <SelectItem value="high" className={darkMode ? 'text-white' : ''}>High</SelectItem>
                          <SelectItem value="medium" className={darkMode ? 'text-white' : ''}>Medium</SelectItem>
                          <SelectItem value="low" className={darkMode ? 'text-white' : ''}>Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dueDate" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Due Date
                      </Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addTask} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <Check className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                    <Button onClick={() => setIsAddingTask(false)} variant="outline" className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            All ({tasks.length})
          </Button>
          {categories.map(cat => {
            const count = tasks.filter(t => t.category === cat.id).length
            const progress = getCategoryProgress(cat.id)
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id ? `${cat.color} text-white` : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                {cat.name} ({count}) {count > 0 && `- ${progress}%`}
              </Button>
            )
          })}
        </div>

        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <Filter className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className={selectedFilter === 'all' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            All
          </Button>
          <Button
            variant={selectedFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('active')}
            className={selectedFilter === 'active' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Active ({activeCount})
          </Button>
          <Button
            variant={selectedFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('completed')}
            className={selectedFilter === 'completed' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Completed ({completedCount})
          </Button>
          <Button
            variant={selectedFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('today')}
            className={selectedFilter === 'today' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Today
          </Button>
          <Button
            variant={selectedFilter === 'thisWeek' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('thisWeek')}
            className={selectedFilter === 'thisWeek' ? 'bg-blue-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            This Week
          </Button>
          <Button
            variant={selectedFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('overdue')}
            className={selectedFilter === 'overdue' ? 'bg-red-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Overdue ({overdueCount})
          </Button>
          <div className="ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={`w-40 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                <SelectItem value="order" className={darkMode ? 'text-white' : ''}>Manual Order</SelectItem>
                <SelectItem value="priority" className={darkMode ? 'text-white' : ''}>Priority</SelectItem>
                <SelectItem value="dueDate" className={darkMode ? 'text-white' : ''}>Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="py-12 text-center">
                  <CheckCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tasks found. Add a new task to get started!
                  </p>
                </CardContent>
              </Card>
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
                  <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} ${task.completed ? 'opacity-60' : ''} border-l-4 ${getPriorityColor(task.priority).split(' ')[1]}`}>
                    <CardContent className="p-4">
                      {editingTaskId === task.id ? (
                        <div className="space-y-3">
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                            className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
                          <Textarea
                            value={task.description}
                            onChange={(e) => updateTask(task.id, { description: e.target.value })}
                            className={darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingTaskId(null)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => setEditingTaskId(null)} variant="outline" size="sm" className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}>
                              <X className="h-4 w-4" />
                            </Button>
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingTaskId(task.id)}
                                  className={`h-8 w-8 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : ''}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteTask(task.id)}
                                  className={`h-8 w-8 ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'text-red-600'}`}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
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
                    </CardContent>
                  </Card>
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
            <Card className={`${darkMode ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'}`}>
              <CardContent className="py-8">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Congratulations!
                </h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  You have completed all your tasks. Great job!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// END OF FILE