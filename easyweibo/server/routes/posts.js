import { Router } from 'express'
import pool from '../db.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const router = Router()

function extractTags(content) {
  const matches = content.match(/#[一-龥\w]+/g)
  return matches ? [...new Set(matches.map((t) => t.slice(1)))] : []
}

async function syncTags(postId, tags) {
  await pool.query('DELETE FROM post_tags WHERE post_id = ?', [postId])
  for (const tag of tags) {
    const [existing] = await pool.query('SELECT id FROM tags WHERE name = ?', [tag])
    let tagId
    if (existing.length > 0) {
      tagId = existing[0].id
    } else {
      const [r] = await pool.query('INSERT INTO tags (name) VALUES (?)', [tag])
      tagId = r.insertId
    }
    await pool.query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId])
  }
}

async function attachTags(postId) {
  const [rows] = await pool.query(
    'SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?',
    [postId],
  )
  return rows.map((r) => r.name)
}

const postSelect = `
  SELECT p.id, p.title, p.content, p.user_id AS userId, p.created_at AS createdAt,
         u.username, u.nickname, u.avatar,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentCount,
         (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likeCount
  FROM posts p
  JOIN users u ON p.user_id = u.id
`

// GET /api/posts - 帖子列表（分页 + 搜索 + 标签筛选）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50)
    const offset = (page - 1) * pageSize
    const search = req.query.search || ''
    const tag = req.query.tag || ''
    const userId = req.userId || 0

    let where = 'WHERE 1=1'
    const params = []

    if (search) {
      where += ' AND p.title LIKE ?'
      params.push(`%${search}%`)
    }

    if (tag) {
      where += ' AND p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.name = ?)'
      params.push(tag)
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM posts p ${where}`, params)
    const total = countRows[0].total

    const [rows] = await pool.query(
      `${postSelect} ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    )

    const list = await Promise.all(
      rows.map(async (row) => {
        const tags = await attachTags(row.id)
        let isLiked = false
        if (userId) {
          const [lk] = await pool.query('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?', [userId, row.id])
          isLiked = lk.length > 0
        }
        return { ...row, avatar: row.avatar || '', title: row.title || '', tags, isLiked }
      }),
    )

    res.json({ code: 200, message: 'ok', data: { list, total } })
  } catch (err) {
    console.error('Get posts error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// GET /api/posts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`${postSelect} WHERE p.id = ?`, [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }
    const row = rows[0]
    const tags = await attachTags(row.id)
    let isLiked = false
    if (req.userId) {
      const [lk] = await pool.query('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?', [req.userId, row.id])
      isLiked = lk.length > 0
    }
    res.json({
      code: 200,
      message: 'ok',
      data: { ...row, avatar: row.avatar || '', title: row.title || '', tags, isLiked },
    })
  } catch (err) {
    console.error('Get post error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// POST /api/posts
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, title } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '内容不能为空' })
    }

    const postTitle = (title || '').trim()
    const postContent = content.trim()
    const tags = extractTags(postContent)

    const [result] = await pool.query('INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)', [
      postTitle,
      postContent,
      req.userId,
    ])

    const postId = result.insertId
    if (tags.length > 0) {
      await syncTags(postId, tags)
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.content, p.user_id AS userId, p.created_at AS createdAt,
              u.username, u.nickname, u.avatar, 0 AS commentCount, 0 AS likeCount
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId],
    )

    res.json({
      code: 200,
      message: '发布成功',
      data: { ...rows[0], avatar: rows[0].avatar || '', title: rows[0].title || '', tags, isLiked: false },
    })
  } catch (err) {
    console.error('Create post error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }
    if (rows[0].user_id !== req.userId) {
      return res.status(403).json({ code: 403, message: '无权删除他人帖子' })
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    console.error('Delete post error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

export default router
