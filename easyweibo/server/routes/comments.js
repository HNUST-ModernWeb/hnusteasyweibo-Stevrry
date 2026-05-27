import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// GET /api/posts/:postId/comments
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.user_id AS userId, c.post_id AS postId,
              c.parent_id AS parentId, c.reply_to_user_id AS replyToUserId,
              c.created_at AS createdAt,
              u.username, u.nickname, u.avatar,
              ru.username AS replyToUsername, ru.nickname AS replyToNickname
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN users ru ON c.reply_to_user_id = ru.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.postId],
    )

    const list = rows.map((row) => ({
      ...row,
      avatar: row.avatar || '',
      replyToUsername: row.replyToUsername || '',
      replyToNickname: row.replyToNickname || '',
    }))
    res.json({ code: 200, message: 'ok', data: list })
  } catch (err) {
    console.error('Get comments error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// POST /api/posts/:postId/comments
router.post('/posts/:postId/comments', authMiddleware, async (req, res) => {
  try {
    const { content, parentId, replyToUserId } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '评论内容不能为空' })
    }

    const [postRows] = await pool.query('SELECT id FROM posts WHERE id = ?', [req.params.postId])
    if (postRows.length === 0) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    const [result] = await pool.query(
      'INSERT INTO comments (content, user_id, post_id, parent_id, reply_to_user_id) VALUES (?, ?, ?, ?, ?)',
      [content.trim(), req.userId, req.params.postId, parentId || null, replyToUserId || null],
    )

    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.user_id AS userId, c.post_id AS postId,
              c.parent_id AS parentId, c.reply_to_user_id AS replyToUserId,
              c.created_at AS createdAt,
              u.username, u.nickname, u.avatar,
              ru.username AS replyToUsername, ru.nickname AS replyToNickname
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN users ru ON c.reply_to_user_id = ru.id
       WHERE c.id = ?`,
      [result.insertId],
    )

    const row = rows[0]
    res.json({
      code: 200,
      message: '评论成功',
      data: {
        ...row,
        avatar: row.avatar || '',
        replyToUsername: row.replyToUsername || '',
        replyToNickname: row.replyToNickname || '',
      },
    })
  } catch (err) {
    console.error('Create comment error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// DELETE /api/comments/:id
router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '评论不存在' })
    }
    if (rows[0].user_id !== req.userId) {
      return res.status(403).json({ code: 403, message: '无权删除他人评论' })
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    console.error('Delete comment error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

export default router
