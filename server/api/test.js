// Минимальный тестовый эндпоинт для Vercel
module.exports = async (req, res) => {
  try {
    // Простой ответ без зависимостей
    res.status(200).json({
      status: 'OK',
      message: 'Serverless function working',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'],
        'host': req.headers['host']
      }
    });
  } catch (error) {
    console.error('Test function error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
