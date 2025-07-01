const express = require('express')
const morgan = require('morgan')
const { createProxyMiddleware } = require('http-proxy-middleware')
const ratelimit = require('express-rate-limit')
const axios = require('axios')

const app = express()

const PORT = 3005

const limiter = ratelimit({
    windowMs: 2 * 60 * 1000, 
    max:5
})

app.use(morgan('combined'))
app.use(limiter)
app.use('/bookingservice', async (req, res, next) => {
  try {
    const response = await axios.get('http://localhost:3001/api/v1/isAuthenticated', {
      headers: {
        'x-access-token': req.headers['x-access-token']
      }
    });
    if (response.data.success) {
      console.log('Auth passed');
      return next();
    } else {
      return res.status(401).json({
        message: 'Authentication failed: token invalid'
      });
    }
  } catch (error) {
     const status = error.response?.status || 500;
    const details = error.response?.data || error.message;

    console.error('Auth failed:', details);

    return res.status(status).json({
      message: 'Authentication check failed',
      error: details
    });
  }
});
app.use('/bookingservice',createProxyMiddleware({target:'http://localhost:3002',changeOrigin:true}))

app.get('/home',(req,res)=>{
  return res.json({
    message:'OK'
  })
})
app.listen(PORT,()=>{
    console.log(`API Gateway is running on port ${PORT}`)
})