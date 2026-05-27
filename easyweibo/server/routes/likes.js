import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// POST /api/posts/:id/like - 切换点赞（点赞/取消点赞）
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.userId

    const [postRows] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId])
    if (postRows.length === 0) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    const [existing] = await pool.query('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId])

    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId])
      const [cnt] = await pool.query('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId])
      res.json({ code: 200, message: '取消点赞', data: { liked: false, likeCount: cnt[0].count } })
    } else {
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId])
      const [cnt] = await pool.query('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId])
      res.json({ code: 200, message: '点赞成功', data: { liked: true, likeCount: cnt[0].count } })
    }
  } catch (err) {
    console.error('Like error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

export default router
