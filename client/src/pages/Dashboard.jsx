import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTasks, createTask, updateTask, toggleComplete, deleteTask } from '../lib/tasksApi'

function Dashboard() {
  const { user, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state (used for both creating and editing)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState(null) // null = creating, otherwise editing this task's id

  // Filter / search / sort state
  const [filter, setFilter] = useState('all') // 'all' | 'active' | 'completed' | 'high'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created') // 'created' | 'due_date' | 'priority' | 'alphabetical'

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

  function getVisibleTasks() {
    let result = [...tasks]

    // Filter
    if (filter === 'active') {
      result = result.filter((t) => !t.completed)
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed)
    } else if (filter === 'high') {
      result = result.filter((t) => t.priority === 'high')
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(query))
    }

    // Sort
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
    // 'created' is already the default order from the API (newest first)

    return result
  }

  const visibleTasks = getVisibleTasks()

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user?.email}</h1>
        <button onClick={signOut}>Log Out</button>
      </header>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button type="submit">{editingId ? 'Save Changes' : 'Add Task'}</button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      <div className="controls">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active-filter' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'active-filter' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'completed' ? 'active-filter' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={filter === 'high' ? 'active-filter' : ''}
            onClick={() => setFilter('high')}
          >
            High Priority
          </button>
        </div>

        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created">Newest First</option>
          <option value="due_date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : visibleTasks.length === 0 ? (
        <p>No tasks yet. Add one above.</p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <li key={task.id} className={`priority-${task.priority}`}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
              />
              <div className="task-info">
                <span
                  className="task-title"
                  style={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
                {task.description && (
                  <span className="task-description">{task.description}</span>
                )}
                <span className="task-meta">
                  {task.priority} priority
                  {task.due_date && ` · due ${task.due_date}`}
                </span>
              </div>
              <button onClick={() => startEdit(task)}>Edit</button>
              <button onClick={() => handleDelete(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard
