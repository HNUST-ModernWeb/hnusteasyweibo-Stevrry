import { Router } from 'express'
import pool from '../db.js'

const router = Router()

function formatUser(u) {
  return {
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar || '',
    gender: u.gender || '',
    cardColor: u.card_color || '#667eea',
    createdAt: u.created_at,
  }
}

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 200, message: 'ok', data: formatUser(rows[0]) })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// GET /api/users/:id/posts
router.get('/:id/posts', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize

    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM posts WHERE user_id = ?', [req.params.id])
    const total = countRows[0].total

    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.content, p.user_id AS userId, p.created_at AS createdAt,
              u.username, u.nickname, u.avatar,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentCount,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likeCount
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, pageSize, offset],
    )

    const list = rows.map((row) => ({ ...row, avatar: row.avatar || '', title: row.title || '' }))
    res.json({ code: 200, message: 'ok', data: { list, total } })
  } catch (err) {
    console.error('Get user posts error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

export default router
