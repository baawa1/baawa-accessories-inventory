// Simple test to verify Jest configuration
describe('Jest Configuration', () => {
  it('should work with modern dependencies', () => {
    expect(true).toBe(true)
  })

  it('should support TypeScript', () => {
    const message: string = 'TypeScript is working'
    expect(message).toBe('TypeScript is working')
  })

  it('should support basic DOM operations', () => {
    const div = document.createElement('div')
    div.innerHTML = 'Hello World'
    expect(div.textContent).toBe('Hello World')
  })
})
