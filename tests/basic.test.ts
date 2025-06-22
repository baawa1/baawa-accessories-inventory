// Basic test to verify Jest is working
describe('Basic Test Suite', () => {
  describe('Simple functionality', () => {
    it('should pass basic test', () => {
      expect(true).toBe(true)
    })

    it('should handle numbers correctly', () => {
      expect(1 + 1).toBe(2)
    })
  })
})
