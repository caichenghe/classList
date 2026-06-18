const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const BASE_URL = 'https://classlist-server-270569-5-1443465012.sh.run.tcloudbase.com'

exports.main = async (event, context) => {
  const { path, method = 'GET', data = {} } = event
  
  try {
    const url = `${BASE_URL}${path}`
    
    const result = await cloud.httpClient.request({
      url,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      },
      responseType: 'json'
    })
    
    return result.data
  } catch (error) {
    console.error('API Proxy Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}