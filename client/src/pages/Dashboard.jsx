import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTasks, createTask, updateTask, toggleComplete, deleteTask } from '../lib/tasksApi'

const PRIORITY_STYLES = {
  high: { border: 'border-l-coral', badge: 'bg-coral/10 text-coral' },
  medium: { border: 'border-l-brand', badge: 'bg-brand/10 text-brand' },
  low: { border: 'border-l-success', badge: 'bg-success/10 text-success' },
}

function Dashboard() {
  const { user, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created')

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      setLoading(true)
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setEditingId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    const taskData = {
      title,
      description,
      priority,
      due_date: dueDate || null,
    }

    try {
      if (editingId) {
        await updateTask(editingId, taskData)
      } else {
        await createTask(taskData)
      }
      resetForm()
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit(task) {
    setEditingId(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setDueDate(task.due_date || '')
  }

  async function handleToggle(task) {
    try {
      await toggleComplete(task.id, !task.completed)
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id)
      if (editingId === id) resetForm()
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  function getStats() {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const remaining = total - completed
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, remaining, completionRate }
  }

  function getVisibleTasks() {
    let result = [...tasks]

    if (filter === 'active') {
      result = result.filter((t) => !t.completed)
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed)
    } else if (filter === 'high') {
      result = result.filter((t) => t.priority === 'high')
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(query))
    }

    if (sortBy === 'due_date') {
      result.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
    } else if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 }
      result.sort((a, b) => order[a.priority] - order[b.priority])
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }

  const stats = getStats()
  const visibleTasks = getVisibleTasks()

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'high', label: 'High Priority' },
  ]

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-4 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Task<span className="text-brand">Flow</span>
          </h1>
          <p className="text-sm text-ink/60 mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm font-medium text-ink/60 hover:text-ink border border-ink/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          Log Out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 space-y-6">
        {/* Stats strip */}
        <div className="bg-surface rounded-2xl border border-ink/5 shadow-sm p-5 grid grid-cols-3 divide-x divide-ink/10">
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-success">{stats.completed}</p>
            <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-brand">{stats.remaining}</p>
            <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">Remaining</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-ink">{stats.completionRate}%</p>
            <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">Completion Rate</p>
          </div>
        </div>

        {/* Flow meter - signature element */}
        <div className="bg-surface rounded-2xl border border-ink/5 shadow-sm p-4">
          <div className="h-3 w-full bg-ink/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-success rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Task form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl border border-ink/5 shadow-sm p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="sm:col-span-2 rounded-lg border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-lg border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="bg-brand hover:bg-brand-dark transition-colors text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              {editingId ? 'Save Changes' : 'Add Task'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-ink/60 hover:text-ink border border-ink/10 rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                  filter === opt.key
                    ? 'bg-brand text-white'
                    : 'bg-surface text-ink/60 border border-ink/10 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border border-ink/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface"
          >
            <option value="created">Newest First</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* Task list */}
        {loading ? (
          <p className="text-sm text-ink/50 text-center py-8">Loading tasks...</p>
        ) : visibleTasks.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-8">No tasks yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {visibleTasks.map((task) => {
              const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
              return (
                <li
                  key={task.id}
                  className={`bg-surface rounded-xl border border-ink/5 border-l-4 ${style.border} shadow-sm p-4 flex items-start gap-3`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggle(task)}
                    className="mt-1 h-4 w-4 accent-brand shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-ink ${
                        task.completed ? 'line-through text-ink/40' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-ink/60 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${style.badge}`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-ink/40 font-mono">due {task.due_date}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="text-xs font-medium text-ink/60 hover:text-brand px-2 py-1 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-xs font-medium text-ink/60 hover:text-coral px-2 py-1 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}

export default Dashboard
