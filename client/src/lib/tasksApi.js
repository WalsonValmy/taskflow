import { supabase } from './supabase'

const API_URL = `${import.meta.env.VITE_API_URL}/api/tasks`

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

export async function fetchTasks() {
  const headers = await getAuthHeaders()
  const res = await fetch(API_URL, { headers })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export async function createTask(task) {
  const headers = await getAuthHeaders()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export async function updateTask(id, updates) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function toggleComplete(id, completed) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${id}/complete`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ completed }),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function deleteTask(id) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete task')
  return res.json()
}