const express = require('express');
const router = express.Router();
const { supabaseAdmin: supabase } = require('../supabaseClient');
const requireAuth = require('../middleware/auth');

// All routes below require a logged-in user
router.use(requireAuth);

// GET /api/tasks - fetch all tasks for the logged-in user
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// POST /api/tasks - create a new task
router.post('/', async (req, res) => {
  const { title, description, priority, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: req.user.id,
        title,
        description: description || null,
        priority: priority || 'medium',
        due_date: due_date || null,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

// PUT /api/tasks/:id - edit an existing task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ title, description, priority, due_date })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (data.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(data[0]);
});

// PATCH /api/tasks/:id/complete - toggle complete status
router.patch('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (data.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(data[0]);
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (data.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;