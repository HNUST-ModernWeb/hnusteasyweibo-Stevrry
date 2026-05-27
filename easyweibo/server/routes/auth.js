import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js'

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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body
    if (!username || !password || !nickname) {
      return res.status(400).json({ code: 400, message: '请填写所有字段' })
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度不能少于6位' })
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '用户名已被注册' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashed, nickname],
    )

    const userId = result.insertId
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: {
          id: userId,
          username,
          nickname,
          avatar: '',
          gender: '',
          cardColor: '#667eea',
          createdAt: new Date().toISOString(),
        },
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' })
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    if (rows.length === 0) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' })
    }

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      code: 200,
      message: '登录成功',
      data: { token, user: formatUser(user) },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId])
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 200, message: 'ok', data: formatUser(rows[0]) })
  } catch (err) {
    console.error('Get me error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, gender, cardColor } = req.body
    const updates = []
    const values = []

    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(nickname)
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?')
      values.push(avatar)
    }
    if (gender !== undefined) {
      updates.push('gender = ?')
      values.push(gender)
    }
    if (cardColor !== undefined) {
      updates.push('card_color = ?')
      values.push(cardColor)
    }

    if (updates.length > 0) {
      values.push(req.userId)
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId])
    res.json({ code: 200, message: '更新成功', data: formatUser(rows[0]) })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

// DELETE /api/auth/account - 注销账号
router.delete('/account', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Ensure placeholder user exists for orphaned comments
    const [placeholders] = await conn.query("SELECT id FROM users WHERE username = '_deleted_'")
    let placeholderId
    if (placeholders.length === 0) {
      const [r] = await conn.query(
        "INSERT INTO users (username, password, nickname) VALUES ('_deleted_', '', '已注销用户')",
      )
      placeholderId = r.insertId
    } else {
      placeholderId = placeholders[0].id
    }

    // Reassign user's comments on other people's posts to placeholder
    await conn.query('UPDATE comments SET user_id = ? WHERE user_id = ?', [placeholderId, req.userId])
    // Handle replies to this user's comments (reply_to_user_id)
    await conn.query('UPDATE comments SET reply_to_user_id = ? WHERE reply_to_user_id = ?', [placeholderId, req.userId])

    // Delete user (cascade deletes their posts, post_tags, likes on their posts, etc.)
    await conn.query('DELETE FROM users WHERE id = ?', [req.userId])

    await conn.commit()
    res.json({ code: 200, message: '账号已注销' })
  } catch (err) {
    await conn.rollback()
    console.error('Delete account error:', err)
    res.status(500).json({ code: 500, message: '服务器错误' })
  } finally {
    conn.release()
  }
})

export default router
