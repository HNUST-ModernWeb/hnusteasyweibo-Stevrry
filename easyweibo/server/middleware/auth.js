import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'easyweibo_jwt_secret_key_2024'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' })
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET)
      req.userId = payload.userId
    } catch {
      // token invalid, ignore
    }
  }
  next()
}

export { JWT_SECRET }
