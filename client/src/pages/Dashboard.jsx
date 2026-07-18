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

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Add one above.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
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