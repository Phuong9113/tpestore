// Test script for GHN Order Detail API
const testGHNOrderDetail = async () => {
  try {
    // Test with a sample GHN order code
    const orderCode = "5ENLKKHD" // Sample order code from the documentation
    
    const response = await fetch('http://localhost:3001/api/admin/orders/ghn/' + orderCode, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('GHN Order Detail Response:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('Error testing GHN order detail:', error)
  }
}

// Run the test
testGHNOrderDetail()
