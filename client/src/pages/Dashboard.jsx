import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTasks, createTask, toggleComplete, deleteTask } from '../lib/tasksApi'

function Dashboard() {
  const { user, signOut } = useAuth()
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createTask({ title, priority: 'medium' })
      setTitle('')
      loadTasks()
    } catch (err) {
      setError(err.message)
    }
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

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Add one above.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
              />
              <span
                style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </span>
              <button onClick={() => handleDelete(task.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard